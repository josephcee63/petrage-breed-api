import { getBreedContent } from "../src/api/getBreedContent.js";

async function run() {
  const input = process.argv[2] || "acd";

  console.log("Testing breed:", input);

  const result = await getBreedContent(input, {
    baseUrl: "https://petrage.net"
  });

  if (!result) {
    console.log("Breed not found.");
    return;
  }

  console.log("\nResolved Breed:");
  console.log(result.breed.display_name);

  console.log("\nTag Slugs Queried:");
  console.log(result.content_query.tag_slugs_queried);

  console.log("\nPosts Found:", result.posts.length);

  console.log("\nFirst 5 Posts:\n");

  result.posts.slice(0,5).forEach((post) => {
    console.log(post.title);
    console.log(post.link);
    console.log("Matched Tags:", post.matched_tags);
    console.log("-----");
  });
}

run().catch(console.error);