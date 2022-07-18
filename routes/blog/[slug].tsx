/** @jsx h */
import { h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";
import PostSchema from "../../types/PostSchema.ts";
import getDB from "../../utils/mongoConnection.ts";
import { CSS, render } from "https://deno.land/x/gfm/mod.ts";
import NotFound from '../../components/NotFound.tsx';

export const handler: Handlers<PostSchema | null> = {
  async GET(_, ctx) {
    // @ts-ignore
    console.log(ctx.state)

    const postsCollection = (await getDB()).collection<PostSchema>('posts');
    const post = await postsCollection.findOne({
      slug: ctx.params.slug,
    });

    if(!post) {
      return ctx.render(null);
    }

    return ctx.render(post);
  }
}

export default function PostPage(props: PageProps) {
  const { data: post }: { data: PostSchema } = props;

  if(!post) {
    return (
      <NotFound />
    );
  }

  return (
    <div>
      <main data-color-mode="light" data-light-theme="light" data-dark-theme="dark" dangerouslySetInnerHTML={{ __html: render(post.content) }}>
      </main>
    </div>
  );
}