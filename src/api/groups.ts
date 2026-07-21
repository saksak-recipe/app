import { apiClient } from '@/api/client';
import type {
  CreateGroupRequest,
  Group,
  GroupInvite,
  InviteByNicknameRequest,
  JoinByCodeRequest,
  MergeRequest,
  MergeResponse,
  UpdateGroupRequest,
} from '@/types/api';

export async function createGroup(payload: CreateGroupRequest): Promise<Group> {
  const { data } = await apiClient.post<Group>('/groups', payload);
  return data;
}

export async function getMyGroup(): Promise<Group> {
  const { data } = await apiClient.get<Group>('/groups/me');
  return data;
}

export async function updateMyGroup(payload: UpdateGroupRequest): Promise<Group> {
  const { data } = await apiClient.patch<Group>('/groups/me', payload);
  return data;
}

export async function dissolveGroup(): Promise<void> {
  await apiClient.delete('/groups/me');
}

export async function leaveGroup(): Promise<void> {
  await apiClient.post('/groups/me/leave');
}

export async function kickMember(userId: string): Promise<void> {
  await apiClient.delete(`/groups/me/members/${userId}`);
}

export async function rotateInviteCode(): Promise<Group> {
  const { data } = await apiClient.post<Group>('/groups/me/rotate-code');
  return data;
}

export async function inviteByNickname(
  payload: InviteByNicknameRequest,
): Promise<GroupInvite> {
  const { data } = await apiClient.post<GroupInvite>('/groups/me/invites', payload);
  return data;
}

export async function listMyInvites(): Promise<GroupInvite[]> {
  const { data } = await apiClient.get<GroupInvite[]>('/groups/invites');
  return data;
}

export async function acceptInvite(inviteId: string): Promise<Group> {
  const { data } = await apiClient.post<Group>(`/groups/invites/${inviteId}/accept`);
  return data;
}

export async function rejectInvite(inviteId: string): Promise<void> {
  await apiClient.post(`/groups/invites/${inviteId}/reject`);
}

export async function joinByCode(payload: JoinByCodeRequest): Promise<Group> {
  const { data } = await apiClient.post<Group>('/groups/join', payload);
  return data;
}

export async function mergePersonalIntoGroup(
  payload: MergeRequest,
): Promise<MergeResponse> {
  const { data } = await apiClient.post<MergeResponse>('/groups/me/merge', payload);
  return data;
}
