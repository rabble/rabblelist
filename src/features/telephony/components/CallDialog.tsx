import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { telephonyService } from '../telephony.service';
import { CallSession, CallOutcome } from '../types';
import { formatTime } from '@/lib/utils';

interface CallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  contactPhone: string;
}

export function CallDialog({ 
  isOpen, 
  onClose, 
  contactId, 
  contactName,
  contactPhone 
}: CallDialogProps) {
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Call outcome form state
  const [outcome, setOutcome] = useState<Partial<CallOutcome>>({
    status: 'reached',
    sentiment: 'neutral',
    nextAction: 'none',
  });

  useEffect(() => {
    if (callStatus === 'connected' && callSession?.startTime) {
      intervalRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - new Date(callSession.startTime!).getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callStatus, callSession]);

  const handleStartCall = async () => {
    try {
      setCallStatus('connecting');
      const session = await telephonyService.startCall(contactId);
      setCallSession(session);
      setCallStatus('connected');
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('idle');
      // Show error message
    }
  };

  const handleEndCall = async () => {
    try {
      await telephonyService.endCall();
      setCallStatus('ended');
      setShowOutcomeForm(true);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const handleToggleMute = () => {
    telephonyService.toggleMute();
    setIsMuted(!isMuted);
  };

  const handleSaveOutcome = async () => {
    if (!callSession) return;

    try {
      await telephonyService.saveCallOutcome(callSession.id, outcome as CallOutcome);
      onClose();
    } catch (error) {
      console.error('Failed to save call outcome:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {showOutcomeForm ? 'Call Outcome' : 'Calling'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showOutcomeForm ? (
            // Call interface
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-xl font-medium">{contactName}</h3>
                <p className="text-gray-500">****{contactPhone.slice(-4)}</p>
              </div>

              {/* Call status */}
              <div className="mb-8">
                {callStatus === 'idle' && (
                  <p className="text-gray-500">Ready to call</p>
                )}
                {callStatus === 'connecting' && (
                  <p className="text-blue-600">Connecting...</p>
                )}
                {callStatus === 'connected' && (
                  <p className="text-green-600 text-2xl font-mono">
                    {formatTime(callDuration)}
                  </p>
                )}
                {callStatus === 'ended' && (
                  <p className="text-gray-500">Call ended</p>
                )}
              </div>

              {/* Call controls */}
              <div className="flex justify-center gap-4">
                {callStatus === 'idle' && (
                  <Button
                    onClick={handleStartCall}
                    className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="w-6 h-6" />
                  </Button>
                )}

                {(callStatus === 'connecting' || callStatus === 'connected') && (
                  <>
                    <Button
                      onClick={handleToggleMute}
                      variant="secondary"
                      className="rounded-full w-16 h-16"
                    >
                      {isMuted ? (
                        <MicOff className="w-6 h-6" />
                      ) : (
                        <Mic className="w-6 h-6" />
                      )}
                    </Button>
                    <Button
                      onClick={handleEndCall}
                      className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </Button>
                  </>
                )}
              </div>

              {/* Live transcript preview (if available) */}
              {callStatus === 'connected' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                  <p className="text-sm text-gray-600 mb-2">Live Transcript</p>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">You:</span> Hello, is this {contactName}?</p>
                    <p><span className="font-medium">Contact:</span> Yes, speaking...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Outcome form
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Call Outcome
                </label>
                <select
                  value={outcome.status}
                  onChange={(e) => setOutcome({ ...outcome, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="reached">Reached</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="no_answer">No Answer</option>
                  <option value="busy">Busy</option>
                  <option value="wrong_number">Wrong Number</option>
                  <option value="disconnected">Disconnected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sentiment
                </label>
                <select
                  value={outcome.sentiment}
                  onChange={(e) => setOutcome({ ...outcome, sentiment: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Action
                </label>
                <select
                  value={outcome.nextAction}
                  onChange={(e) => setOutcome({ ...outcome, nextAction: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="callback">Call Back</option>
                  <option value="email">Send Email</option>
                  <option value="visit">Schedule Visit</option>
                  <option value="remove">Remove from List</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={outcome.notes || ''}
                  onChange={(e) => setOutcome({ ...outcome, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any notes about the call..."
                />
              </div>

              {/* AI-generated summary (placeholder) */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">AI Summary</p>
                <p className="text-sm text-blue-700">
                  Contact was interested in the upcoming event. They asked about parking 
                  availability and mentioned they might bring a friend. Suggested following 
                  up with event details via email.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveOutcome}
                  className="flex-1"
                >
                  Save Outcome
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}