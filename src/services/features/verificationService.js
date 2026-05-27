import core from '@/services/api/core';
import { CORE } from '@/services/api/endpoints';
import { mockApiService, safeApiCall } from '@/services/mockApiService';

const verificationService = {
  listVerifications: () => safeApiCall(
    () => core.get(CORE.VERIFICATION.LIST_PENDING).then(r => r.data),
    () => mockApiService.getAllSkillProofs()
  ),

  decideVerification: (id, decision) => safeApiCall(
    () => core.post(CORE.VERIFICATION.DECIDE(id), { status: decision }).then(r => r.data),
    () => mockApiService.updateSkillProof(id, { 
      status: decision,
      reviewed_at: new Date().toISOString(),
    })
  ),
};

export default verificationService;
