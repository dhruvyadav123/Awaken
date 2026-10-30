const videos = [
  ["daLq4PSx_GQ", "Are we destroying our kids?"],
  ["VbyoXOalwuA", "Ho'oponopono charity"],
  ["l498vFK_Bgs", "The journey of self-acceptance"],
  ["w7L5KEph76k", "Superteeness"],
  ["0Uy8--CQx_4", "Conscious food"],
  ["M14shT28Luc", "Relationship: are you sure?"],
  ["TK_qzekcLoE", "Create your life with Meheck"],
  ["XPaBkWb3xuc", "Comfortable distance and distinction"],
  ["T8PDirKeZUs", "Creation or sabotage"],
  ["HFmW77syr48", "This is your guide to you"],
  ["7RRVeSAVP9I", "End the hunger games"],
  ["gbc3NNGqb7g", "What is true choice?"],
  ["NAKdU-Lgd3s", "Your guide to your inner child"],
  ["_nOowT7Qi2s", "Child abuse parenting neglect"],
  ["9gPK3ynyH58", "Your guide to anger management"],
  ["QyCiqWbYWCg", "Meet Meheck"],
  ["LNlsPLT6Yb0", "AwakenWithMeheck"],
];

export const mediaVideos = videos.map(([id, title]) => ({
  id,
  title,
  href: `https://www.youtube.com/watch?v=${id}`,
  thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
}));
