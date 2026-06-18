export type CommunityResourceType = 'gif' | 'file' | 'link';

export type CommunityResource = {
  id: string;
  name: string;
  type: CommunityResourceType;
  link: string;
  redirect?: string;
  description?: string;
  downloadable?: boolean;
};

export async function fetchCommunityResources(): Promise<CommunityResource[]> {
  const response = await fetch('/api/community/search');
  if (!response.ok) throw new Error('Community search API failed');

  const data = await response.json() as CommunityResource[];
  return Array.isArray(data) ? data : [];
}
