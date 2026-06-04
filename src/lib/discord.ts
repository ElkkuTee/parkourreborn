export type DiscordProfile = {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  email: string | null;
  linkedAt: string;
};

export const discordAvatar = (profile: DiscordProfile) => {
  if (!profile.avatar) return '';
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`;
};
