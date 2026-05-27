import core from '../api/core';
import { CORE } from '../api/endpoints';
import { mockApiService, safeApiCall } from '@/services/mockApiService';

const messageService = {
  getConversations: () => safeApiCall(
    () => core.get(CORE.MESSAGES.CONVERSATIONS).then(r => r.data),
    () => mockApiService.getConversations()
  ),

  getMessages: (conversationId) => safeApiCall(
    () => core.get(CORE.MESSAGES.CONVERSATION(conversationId)).then(r => r.data),
    () => mockApiService.getConversation(conversationId)
  ),

  sendMessage: (conversationId, content) => safeApiCall(
    () => core.post(CORE.MESSAGES.SEND(conversationId), { content }).then(r => r.data),
    () => mockApiService.sendDM(conversationId, content)
  ),
};

export default messageService;
