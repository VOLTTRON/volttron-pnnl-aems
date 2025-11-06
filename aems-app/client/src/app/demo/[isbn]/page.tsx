"use server";

import Link from "next/link";
import { findBook } from "../books";

export default async function Page({ params }: { params: Promise<{ isbn: string }> }) {
  const { isbn } = await params;

  const book = await findBook(isbn);

  if (!book) {
    return <h1>Book not found</h1>;
  }

  return (
    <>
      <h1>Title</h1>
      <p>{book?.title}</p>
      <h2>Author</h2>
      <p>{book?.author}</p>
      <h2>ISBN</h2>
      <p>{book?.isbn}</p>
      <h3>Pages</h3>
      <p>{book?.pages}</p>
      <h3>Audio</h3>
      <p>{book?.duration}</p>
      <h3>Published</h3>
      <p>{book?.date}</p>
      <h3>Chapters:</h3>
      <ul>
        {book?.chapters.map((chapter, i) => (
          <li key={i}>
            <Link key={i} href={`/demo/${book.isbn}/${i}`}>
              {chapter.title}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
