import { create } from 'zustand'
import { PathwayService } from '@/features/pathways/pathways.service'
import type { Pathway, PathwayStep, PathwayMember, PathwayWithSteps, PathwayWithDetails } from '@/features/pathways/pathways.service'

interface PathwayStore {
  pathways: PathwayWithDetails[]
  currentPathway: PathwayWithSteps | null
  pathwayMembers: PathwayMember[]
  isLoadingPathways: boolean
  isLoadingPathway: boolean
  isLoadingMembers: boolean
  
  // Actions
  loadPathways: () => Promise<void>
  loadPathway: (id: string) => Promise<void>
  createPathway: (pathway: Partial<Pathway>) => Promise<Pathway | null>
  updatePathway: (id: string, updates: Partial<Pathway>) => Promise<boolean>
  deletePathway: (id: string) => Promise<boolean>
  
  // Step management
  createStep: (step: Partial<PathwayStep>) => Promise<PathwayStep | null>
  updateStep: (id: string, updates: Partial<PathwayStep>) => Promise<boolean>
  deleteStep: (id: string) => Promise<boolean>
  reorderSteps: (pathwayId: string, steps: { id: string; order_index: number }[]) => Promise<boolean>
  
  // Member management
  loadPathwayMembers: (pathwayId: string) => Promise<void>
  addMemberToPathway: (pathwayId: string, contactId: string) => Promise<boolean>
  updateMemberProgress: (memberId: string, updates: Partial<PathwayMember>) => Promise<boolean>
  removeMemberFromPathway: (memberId: string) => Promise<boolean>
}

export const usePathwayStore = create<PathwayStore>((set, get) => ({
  pathways: [],
  currentPathway: null,
  pathwayMembers: [],
  isLoadingPathways: false,
  isLoadingPathway: false,
  isLoadingMembers: false,

  loadPathways: async () => {
    set({ isLoadingPathways: true })
    
    try {
      const data = await PathwayService.getPathways()

      // Calculate member counts and completion rates for each pathway
      const pathwaysWithStats = await Promise.all((data || []).map(async (pathway: PathwayWithDetails) => {
        const stats = await PathwayService.getPathwayStats(pathway.id)
        return {
          ...pathway,
          member_count: stats.totalMembers,
          completion_rate: stats.completionRate,
          average_duration: stats.averageDuration
        }
      }))

      set({ pathways: pathwaysWithStats })
    } catch (error) {
      console.error('Error loading pathways:', error)
    } finally {
      set({ isLoadingPathways: false })
    }
  },

  loadPathway: async (id: string) => {
    set({ isLoadingPathway: true })
    
    try {
      const data = await PathwayService.getPathway(id)

      if (data) {
        // Calculate stats for the pathway
        const stats = await PathwayService.getPathwayStats(id)
        const pathwayWithStats = {
          ...data,
          member_count: stats.totalMembers,
          completion_rate: stats.completionRate,
          average_duration: stats.averageDuration
        }
        
        set({ currentPathway: pathwayWithStats })
      }
    } catch (error) {
      console.error('Error loading pathway:', error)
    } finally {
      set({ isLoadingPathway: false })
    }
  },

  createPathway: async (pathway: Partial<Pathway>) => {
    try {
      const data = await PathwayService.createPathway(pathway)
      
      if (data) {
        // Reload pathways to include the new one
        await get().loadPathways()
        return data
      }
      
      return null
    } catch (error) {
      console.error('Error creating pathway:', error)
      return null
    }
  },

  updatePathway: async (id: string, updates: Partial<Pathway>) => {
    try {
      const data = await PathwayService.updatePathway(id, updates)
      
      if (data) {
        // Update in local state
        set(state => ({
          pathways: state.pathways.map(p => p.id === id ? { ...p, ...updates } : p),
          currentPathway: state.currentPathway?.id === id ? { ...state.currentPathway, ...updates } : state.currentPathway
        }))
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error updating pathway:', error)
      return false
    }
  },

  deletePathway: async (id: string) => {
    try {
      await PathwayService.deletePathway(id)
      
      // Remove from local state
      set(state => ({
        pathways: state.pathways.filter(p => p.id !== id),
        currentPathway: state.currentPathway?.id === id ? null : state.currentPathway
      }))
      
      return true
    } catch (error) {
      console.error('Error deleting pathway:', error)
      return false
    }
  },

  // Step management
  createStep: async (step: Partial<PathwayStep>) => {
    try {
      const data = await PathwayService.createPathwayStep(step)
      
      if (data && step.pathway_id) {
        // Reload current pathway to include the new step
        await get().loadPathway(step.pathway_id)
        return data
      }
      
      return null
    } catch (error) {
      console.error('Error creating step:', error)
      return null
    }
  },

  updateStep: async (id: string, updates: Partial<PathwayStep>) => {
    try {
      const data = await PathwayService.updatePathwayStep(id, updates)
      
      if (data) {
        // Update step in current pathway
        set(state => ({
          currentPathway: state.currentPathway ? {
            ...state.currentPathway,
            pathway_steps: state.currentPathway.pathway_steps?.map(s => 
              s.id === id ? { ...s, ...updates } : s
            )
          } : null
        }))
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error updating step:', error)
      return false
    }
  },

  deleteStep: async (id: string) => {
    try {
      await PathwayService.deletePathwayStep(id)
      
      // Remove step from current pathway
      set(state => ({
        currentPathway: state.currentPathway ? {
          ...state.currentPathway,
          pathway_steps: state.currentPathway.pathway_steps?.filter(s => s.id !== id)
        } : null
      }))
      
      return true
    } catch (error) {
      console.error('Error deleting step:', error)
      return false
    }
  },

  reorderSteps: async (pathwayId: string, steps: { id: string; order_index: number }[]) => {
    try {
      await PathwayService.reorderPathwaySteps(pathwayId, steps)
      
      // Update order in current pathway
      set(state => ({
        currentPathway: state.currentPathway ? {
          ...state.currentPathway,
          pathway_steps: state.currentPathway.pathway_steps?.map(s => {
            const update = steps.find(u => u.id === s.id)
            return update ? { ...s, order_index: update.order_index } : s
          }).sort((a, b) => a.order_index - b.order_index)
        } : null
      }))
      
      return true
    } catch (error) {
      console.error('Error reordering steps:', error)
      return false
    }
  },

  // Member management
  loadPathwayMembers: async (pathwayId: string) => {
    set({ isLoadingMembers: true })
    
    try {
      const data = await PathwayService.getPathwayMembers(pathwayId)
      set({ pathwayMembers: data || [] })
    } catch (error) {
      console.error('Error loading pathway members:', error)
    } finally {
      set({ isLoadingMembers: false })
    }
  },

  addMemberToPathway: async (pathwayId: string, contactId: string) => {
    try {
      const data = await PathwayService.addMemberToPathway(pathwayId, contactId)
      
      if (data) {
        // Reload members
        await get().loadPathwayMembers(pathwayId)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error adding member to pathway:', error)
      return false
    }
  },

  updateMemberProgress: async (memberId: string, updates: Partial<PathwayMember>) => {
    try {
      const data = await PathwayService.updateMemberProgress(memberId, updates)
      
      if (data) {
        // Update member in local state
        set(state => ({
          pathwayMembers: state.pathwayMembers.map(m => 
            m.id === memberId ? { ...m, ...updates } : m
          )
        }))
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error updating member progress:', error)
      return false
    }
  },

  removeMemberFromPathway: async (memberId: string) => {
    try {
      await PathwayService.removeMemberFromPathway(memberId)
      
      // Remove from local state
      set(state => ({
        pathwayMembers: state.pathwayMembers.filter(m => m.id !== memberId)
      }))
      
      return true
    } catch (error) {
      console.error('Error removing member from pathway:', error)
      return false
    }
  }
}))