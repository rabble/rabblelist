import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'

export class QRCodeService {
  /**
   * Generate a unique check-in code for an event registration
   */
  static generateCheckInCode(eventId: string, registrationId: string): string {
    // Create a unique code that includes event and registration IDs
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36)
    const code = `EVT-${eventId.slice(0, 8)}-${registrationId.slice(0, 8)}-${timestamp}`
    return code
  }

  /**
   * Generate QR code data URL from check-in code
   */
  static async generateQRCode(checkInCode: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
    try {
      const defaultOptions: QRCode.QRCodeToDataURLOptions = {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        ...options
      }
      
      return await QRCode.toDataURL(checkInCode, defaultOptions)
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Generate QR code for event check-in URL
   */
  static async generateEventCheckInQR(
    eventId: string, 
    registrationId: string,
    baseUrl: string = window.location.origin
  ): Promise<string> {
    const checkInUrl = `${baseUrl}/events/${eventId}/check-in/${registrationId}`
    return this.generateQRCode(checkInUrl)
  }

  /**
   * Validate check-in code format
   */
  static validateCheckInCode(code: string): boolean {
    // Check if code matches our format: EVT-{eventId}-{registrationId}-{timestamp}
    const pattern = /^EVT-[a-f0-9]{8}-[a-f0-9]{8}-[a-z0-9]+$/
    return pattern.test(code)
  }

  /**
   * Parse check-in code to extract IDs
   */
  static parseCheckInCode(code: string): { eventId: string; registrationId: string } | null {
    if (!this.validateCheckInCode(code)) {
      return null
    }

    const parts = code.split('-')
    if (parts.length !== 4) {
      return null
    }

    return {
      eventId: parts[1],
      registrationId: parts[2]
    }
  }

  /**
   * Verify QR code and perform check-in
   */
  static async verifyAndCheckIn(
    code: string,
    userId: string
  ): Promise<{ success: boolean; message: string; registration?: any }> {
    try {
      // Parse the check-in code
      const parsed = this.parseCheckInCode(code)
      if (!parsed) {
        return { success: false, message: 'Invalid check-in code format' }
      }

      // Get the registration
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (
            id,
            name,
            start_time,
            end_time
          )
        `)
        .eq('id', parsed.registrationId)
        .single()

      if (regError || !registration) {
        return { success: false, message: 'Registration not found' }
      }

      // Verify event ID matches
      if (!registration.event_id.startsWith(parsed.eventId)) {
        return { success: false, message: 'Invalid code for this event' }
      }

      // Check if already checked in
      if (registration.checked_in) {
        return { 
          success: false, 
          message: `Already checked in at ${new Date(registration.check_in_time).toLocaleString()}`,
          registration
        }
      }

      // Perform check-in
      const { data: updated, error: updateError } = await supabase
        .from('event_registrations')
        .update({
          checked_in: true,
          check_in_time: new Date().toISOString(),
          checked_in_by: userId,
          status: 'attended'
        })
        .eq('id', registration.id)
        .select()
        .single()

      if (updateError) {
        console.error('Check-in error:', updateError)
        return { success: false, message: 'Failed to check in attendee' }
      }

      return {
        success: true,
        message: 'Successfully checked in!',
        registration: updated
      }
    } catch (error) {
      console.error('QR verification error:', error)
      return { success: false, message: 'An error occurred during check-in' }
    }
  }

  /**
   * Generate printable badge with QR code
   */
  static async generateBadgeHTML(
    registration: any,
    eventName: string,
    qrCodeDataUrl: string
  ): Promise<string> {
    return `
      <div style="width: 4in; height: 3in; padding: 0.5in; border: 1px solid #ddd; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px;">${eventName}</h2>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <h3 style="margin: 0; font-size: 24px;">${registration.first_name} ${registration.last_name}</h3>
            ${registration.organization ? `<p style="margin: 5px 0; font-size: 14px;">${registration.organization}</p>` : ''}
            ${registration.ticket_type ? `<p style="margin: 5px 0; font-size: 12px; color: #666;">${registration.ticket_type}</p>` : ''}
          </div>
          <div style="width: 120px; height: 120px;">
            <img src="${qrCodeDataUrl}" style="width: 100%; height: 100%;" alt="Check-in QR Code" />
          </div>
        </div>
      </div>
    `
  }
}