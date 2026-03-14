import type { WordPressPostSummary } from "./types.js";

export function dedupePosts(posts: WordPressPostSummary[]): WordPressPostSummary[] {
  const dedupedPosts: WordPressPostSummary[] = [];
  const indexByKey = new Map<string, number>();

  for (const post of posts) {
    const key = getPostKey(post);
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      indexByKey.set(key, dedupedPosts.length);
      dedupedPosts.push({
        ...post,
        matched_tags: dedupeTags(post.matched_tags),
        matched_categories: dedupeTags(post.matched_categories),
      });
      continue;
    }

    const existingPost = dedupedPosts[existingIndex];
    if (!existingPost) {
      continue;
    }

    existingPost.matched_tags = dedupeTags([...existingPost.matched_tags, ...post.matched_tags]);
    existingPost.matched_categories = dedupeTags([
      ...existingPost.matched_categories,
      ...post.matched_categories,
    ]);
  }

  return dedupedPosts;
}

function getPostKey(post: WordPressPostSummary): string {
  return post.id > 0 ? `id:${post.id}` : `link:${post.link}`;
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(normalized);
  }

  return unique;
}
