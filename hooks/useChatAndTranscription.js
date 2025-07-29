import { useMemo } from 'react';
import {
  useChat,
  useRoomContext,
  useTranscriptions,
} from '@livekit/components-react';
import { transcriptionToChatMessage } from '@/lib/utils';

export default function useChatAndTranscription() {
  const transcriptions = useTranscriptions();
  const chat = useChat();
  const room = useRoomContext();

  const mergedTranscriptions = useMemo(() => {
    const merged = [
      ...transcriptions.map((transcription) => transcriptionToChatMessage(transcription, room)),
      ...chat.chatMessages,
    ];
    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [transcriptions, chat.chatMessages, room]);

  return { messages: mergedTranscriptions, send: chat.send };
}
