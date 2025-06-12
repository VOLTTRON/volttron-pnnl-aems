"use server";

import { findBook } from "../../books";

export default async function Page({ params }: { params: Promise<{ isbn: string; index: string }> }) {
  const { isbn, index } = await params;

  const book = await findBook(isbn);
  const chapter = book?.chapters[parseInt(index)];

  if (!book) {
    return <h1>Book not found</h1>;
  }

  if (!chapter) {
    return <h1>Chapter not found</h1>;
  }

  return (
    <>
      <h1>Title</h1>
      <p>{book?.title}</p>
      <h2>Chapter</h2>
      <p>{chapter?.title}</p>
      <p>
        Lorem ipsum odor amet, consectetuer adipiscing elit. Odio morbi nam imperdiet pulvinar donec habitant. Nullam
        orci nibh sociosqu; vestibulum eget id sapien eros. Habitasse cras nunc sem duis fringilla justo. Dictum id
        luctus quisque sit faucibus aenean pulvinar. Vulputate cras nisi varius vitae scelerisque et donec. Adipiscing
        aptent augue elit conubia, dapibus quam pellentesque fermentum?
      </p>
      <p>
        Orci eget vehicula class vulputate euismod est; ipsum risus. Eget primis ipsum per tempor facilisi est aptent.
        Dis maximus natoque est venenatis fusce. Dolor imperdiet enim pulvinar tristique viverra varius. Fames inceptos
        curae ex etiam dis sit? Facilisi pharetra diam eu praesent magnis ac aliquet libero. Varius orci sociosqu
        sodales aliquet ad sociosqu praesent consectetur. In nascetur augue nullam nibh a rhoncus sed. Efficitur
        himenaeos hendrerit tempus nullam velit ipsum orci sapien. Hac phasellus ac netus ornare eleifend facilisi.
      </p>
      <p>
        Ultricies morbi inceptos curae vehicula eget. Nam ac molestie id donec sit fames commodo. Mauris consequat
        tempor cras eleifend curae commodo adipiscing. Pellentesque mauris luctus egestas platea interdum vel sociosqu
        metus. Augue ornare ornare bibendum viverra, sem potenti placerat euismod. Fringilla sagittis curae, consequat
        aenean aliquam turpis vel.
      </p>
      <p>
        Neque faucibus rutrum sodales nibh pharetra torquent eget. Purus per augue viverra dis aliquet nostra magna
        ornare. Aliquet lobortis dictumst sed porta purus dictum curabitur bibendum. Porttitor leo habitant erat
        pharetra maecenas suspendisse ridiculus. Platea luctus praesent proin ac sodales mi senectus suspendisse.
        Viverra lectus feugiat et posuere dui ad ullamcorper tempus mus. Suscipit dis parturient nam cras semper
        habitasse.
      </p>
      <p>
        Cubilia suscipit hendrerit efficitur sit vulputate malesuada amet curabitur blandit. Primis eu suscipit
        malesuada arcu cras scelerisque. Euismod sem convallis at purus urna finibus turpis egestas. Aptent nisl proin
        eros arcu enim dapibus vivamus. Mauris mauris blandit blandit pretium faucibus eleifend penatibus. Suspendisse
        facilisis venenatis nunc fusce potenti mattis facilisis. Ornare class etiam pharetra convallis magna. Praesent
        lacinia primis rhoncus mollis urna duis eu cursus a.
      </p>
      <p>...</p>
    </>
  );
}
