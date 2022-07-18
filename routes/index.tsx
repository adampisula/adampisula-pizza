/** @jsx h */
import { h } from "preact";

export default function HomePage() {
  return (
    <div>
      <img
        src="/logo.svg"
        height="100px"
        alt="the fresh logo: a sliced lemon dripping with juice"
      />
      <p>
        Welcome to `fresh`. Try update this msg in the ./routes/index.tsx
        file, and refresh.
      </p>
    </div>
  );
}
