import core from '../api/core';
import { CORE } from '../api/endpoints';
import { mockApiService, safeApiCall } from '@/services/mockApiService';

export const companyService = {
  getCompanies: () => safeApiCall(
    () => core.get(CORE.COMPANY.LIST).then(r => r.data),
    () => mockApiService.getAllOrganizations()
  ),

  getCompanyBySlug: (slug) => safeApiCall(
    () => core.get(CORE.COMPANY.BY_SLUG(slug)).then(r => r.data),
    () => mockApiService.getAllOrganizations().then(list => list.find(o => o.slug === slug || o.id === slug))
  ),

  getMyCompany: () => safeApiCall(
    () => core.get(CORE.COMPANY.ME).then(r => r.data),
    () => mockApiService.getAllOrganizations().then(list => list[0])
  ),

  createCompany: (data) => safeApiCall(
    () => core.post(CORE.COMPANY.CREATE, data).then(r => r.data),
    () => Promise.resolve({ success: true, ...data })
  ),

  updateCompany: (id, data) => safeApiCall(
    () => core.put(CORE.COMPANY.UPDATE(id), data).then(r => r.data),
    () => Promise.resolve({ success: true, ...data })
  ),

  getMembers: (id) => safeApiCall(
    () => core.get(CORE.COMPANY.MEMBERS(id)).then(r => r.data),
    () => Promise.resolve([])
  ),

  addMember: (id, data) => safeApiCall(
    () => core.post(CORE.COMPANY.MEMBER_ADD(id), data).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  removeMember: (id, userId) => safeApiCall(
    () => core.delete(CORE.COMPANY.MEMBER_REMOVE(id, userId)).then(r => r.data),
    () => Promise.resolve({ success: true })
  ),

  getOpportunities: (id) => safeApiCall(
    () => core.get(CORE.COMPANY.OPPORTUNITIES(id)).then(r => r.data),
    () => Promise.resolve([])
  ),

  getTalentPool: (slug) => safeApiCall(
    () => core.get(CORE.COMPANY.TALENT_POOL(slug)).then(r => r.data),
    () => Promise.resolve([])
  ),

  getTeam: (slug) => safeApiCall(
    () => core.get(CORE.COMPANY.TEAM(slug)).then(r => r.data),
    () => Promise.resolve([])
  ),

  getOpenRoles: (slug) => safeApiCall(
    () => core.get(CORE.COMPANY.OPEN_ROLES(slug)).then(r => r.data),
    () => Promise.resolve([])
  ),

  getAnalytics: (slug) => safeApiCall(
    () => core.get(CORE.COMPANY.ANALYTICS(slug)).then(r => r.data),
    () => Promise.resolve({ views: 1240, applications: 45 })
  )
};

export default companyService;
