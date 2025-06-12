import { delay } from "@local/common";

const books = [
  {
    id: 1,
    title: "Leviathan Wakes",
    author: "James S. A. Corey",
    pages: 561,
    duration: "20h 56m",
    date: "June 15, 2011",
    isbn: "978-0-316-12908-4",
    chapters: [
      {
        title: "Prologue",
        pages: 1,
      },
      {
        title: "1: Holden",
        pages: 3,
      },
      {
        title: "2: Miller",
        pages: 21,
      },
      {
        title: "3: Holden",
        pages: 39,
      },
      {
        title: "4: Miller",
        pages: 55,
      },
      {
        title: "5: Holden",
        pages: 71,
      },
      {
        title: "6: Miller",
        pages: 89,
      },
      {
        title: "7: Holden",
        pages: 105,
      },
      {
        title: "8: Miller",
        pages: 123,
      },
      {
        title: "9: Holden",
        pages: 139,
      },
      {
        title: "10: Miller",
        pages: 157,
      },
      {
        title: "11: Holden",
        pages: 173,
      },
      {
        title: "12: Miller",
        pages: 191,
      },
      {
        title: "13: Holden",
        pages: 207,
      },
      {
        title: "14: Miller",
        pages: 225,
      },
      {
        title: "15: Holden",
        pages: 241,
      },
      {
        title: "16: Miller",
        pages: 259,
      },
      {
        title: "17: Holden",
        pages: 275,
      },
      {
        title: "18: Miller",
        pages: 293,
      },
      {
        title: "19: Holden",
        pages: 309,
      },
      {
        title: "20: Miller",
        pages: 327,
      },
      {
        title: "21: Holden",
        pages: 343,
      },
      {
        title: "22: Miller",
        pages: 361,
      },
      {
        title: "23: Holden",
        pages: 377,
      },
      {
        title: "24: Miller",
        pages: 395,
      },
      {
        title: "25: Holden",
        pages: 411,
      },
      {
        title: "26: Miller",
        pages: 429,
      },
      {
        title: "27: Holden",
        pages: 445,
      },
    ],
  },
  {
    id: 2,
    title: "Caliban's War",
    author: "James S. A. Corey",
    pages: 595,
    duration: "21h",
    date: "June 25, 2012",
    isbn: "978-0-316-12906-0",
    chapters: [
      {
        title: "Prologue",
        pages: 1,
      },
      {
        title: "1: Holden",
        pages: 3,
      },
      {
        title: "2: Prax",
        pages: 21,
      },
      {
        title: "3: Holden",
        pages: 39,
      },
      {
        title: "4: Prax",
        pages: 55,
      },
      {
        title: "5: Holden",
        pages: 71,
      },
      {
        title: "6: Prax",
        pages: 89,
      },
      {
        title: "7: Holden",
        pages: 105,
      },
      {
        title: "8: Prax",
        pages: 123,
      },
      {
        title: "9: Holden",
        pages: 139,
      },
      {
        title: "10: Prax",
        pages: 157,
      },
      {
        title: "11: Holden",
        pages: 173,
      },
      {
        title: "12: Prax",
        pages: 191,
      },
      {
        title: "13: Holden",
        pages: 207,
      },
      {
        title: "14: Prax",
        pages: 225,
      },
      {
        title: "15: Holden",
        pages: 241,
      },
      {
        title: "16: Prax",
        pages: 259,
      },
      {
        title: "17: Holden",
        pages: 275,
      },
      {
        title: "18: Prax",
        pages: 293,
      },
      {
        title: "19: Holden",
        pages: 309,
      },
      {
        title: "20: Prax",
        pages: 327,
      },
      {
        title: "21: Holden",
        pages: 343,
      },
      {
        title: "22: Prax",
        pages: 361,
      },
      {
        title: "23: Holden",
        pages: 377,
      },
      {
        title: "24: Prax",
        pages: 395,
      },
      {
        title: "25: Holden",
        pages: 411,
      },
      {
        title: "26: Prax",
        pages: 429,
      },
    ],
  },
  {
    id: 3,
    title: "Abaddon's Gate",
    author: "James S. A. Corey",
    pages: 539,
    duration: "19h 42m",
    date: "June 4, 2013",
    isbn: "978-0-316-12907-7",
    chapters: [
      {
        title: "Prologue",
        pages: 1,
      },
      {
        title: "1: Bull",
        pages: 3,
      },
      {
        title: "2: Holden",
        pages: 21,
      },
      {
        title: "3: Bull",
        pages: 39,
      },
      {
        title: "4: Holden",
        pages: 55,
      },
      {
        title: "5: Bull",
        pages: 71,
      },
      {
        title: "6: Holden",
        pages: 89,
      },
      {
        title: "7: Bull",
        pages: 105,
      },
      {
        title: "8: Holden",
        pages: 123,
      },
      {
        title: "9: Bull",
        pages: 139,
      },
      {
        title: "10: Holden",
        pages: 157,
      },
      {
        title: "11: Bull",
        pages: 173,
      },
      {
        title: "12: Holden",
        pages: 191,
      },
      {
        title: "13: Bull",
        pages: 207,
      },
      {
        title: "14: Holden",
        pages: 225,
      },
      {
        title: "15: Bull",
        pages: 241,
      },
      {
        title: "16: Holden",
        pages: 259,
      },
      {
        title: "17: Bull",
        pages: 275,
      },
      {
        title: "18: Holden",
        pages: 293,
      },
      {
        title: "19: Bull",
        pages: 309,
      },
      {
        title: "20: Holden",
        pages: 327,
      },
      {
        title: "21: Bull",
        pages: 343,
      },
      {
        title: "22: Holden",
        pages: 361,
      },
      {
        title: "23: Bull",
        pages: 377,
      },
      {
        title: "24: Holden",
        pages: 395,
      },
      {
        title: "25: Bull",
        pages: 411,
      },
      {
        title: "26: Holden",
        pages: 429,
      },
    ],
  },
  {
    id: 4,
    title: "Cibola Burn",
    author: "James S. A. Corey",
    pages: 583,
    duration: "20h 7m",
    date: "June 17, 2014",
    isbn: "978-0-316-21762-0",
    chapters: [
      {
        title: "Prologue",
        pages: 1,
      },
      {
        title: "1: Basia",
        pages: 3,
      },
      {
        title: "2: Holden",
        pages: 21,
      },
      {
        title: "3: Basia",
        pages: 39,
      },
      {
        title: "4: Holden",
        pages: 55,
      },
      {
        title: "5: Basia",
        pages: 71,
      },
      {
        title: "6: Holden",
        pages: 89,
      },
      {
        title: "7: Basia",
        pages: 105,
      },
      {
        title: "8: Holden",
        pages: 123,
      },
      {
        title: "9: Basia",
        pages: 139,
      },
      {
        title: "10: Holden",
        pages: 157,
      },
      {
        title: "11: Basia",
        pages: 173,
      },
      {
        title: "12: Holden",
        pages: 191,
      },
      {
        title: "13: Basia",
        pages: 207,
      },
      {
        title: "14: Holden",
        pages: 225,
      },
      {
        title: "15: Basia",
        pages: 241,
      },
      {
        title: "16: Holden",
        pages: 259,
      },
      {
        title: "17: Basia",
        pages: 275,
      },
      {
        title: "18: Holden",
        pages: 293,
      },
      {
        title: "19: Basia",
        pages: 309,
      },
      {
        title: "20: Holden",
        pages: 327,
      },
      {
        title: "21: Basia",
        pages: 343,
      },
      {
        title: "22: Holden",
        pages: 361,
      },
      {
        title: "23: Basia",
        pages: 377,
      },
      {
        title: "24: Holden",
        pages: 395,
      },
      {
        title: "25: Basia",
        pages: 411,
      },
      {
        title: "26: Holden",
        pages: 429,
      },
    ],
  },
  {
    id: 5,
    title: "Nemesis Games",
    author: "James S. A. Corey",
    pages: 544,
    duration: "16h 44m",
    date: "June 2, 2015",
    isbn: "978-0-316-21758-3",
    chapters: [
      {
        title: "Prologue",
        pages: 1,
      },
      {
        title: "1: Amos",
        pages: 3,
      },
      {
        title: "2: Naomi",
        pages: 21,
      },
      {
        title: "3: Alex",
        pages: 39,
      },
      {
        title: "4: Holden",
        pages: 55,
      },
      {
        title: "5: Amos",
        pages: 71,
      },
      {
        title: "6: Naomi",
        pages: 89,
      },
      {
        title: "7: Alex",
        pages: 105,
      },
      {
        title: "8: Holden",
        pages: 123,
      },
      {
        title: "9: Amos",
        pages: 139,
      },
      {
        title: "10: Naomi",
        pages: 157,
      },
      {
        title: "11: Alex",
        pages: 173,
      },
      {
        title: "12: Holden",
        pages: 191,
      },
      {
        title: "13: Amos",
        pages: 207,
      },
      {
        title: "14: Naomi",
        pages: 225,
      },
      {
        title: "15: Alex",
        pages: 241,
      },
      {
        title: "16: Holden",
        pages: 259,
      },
      {
        title: "17: Amos",
        pages: 275,
      },
      {
        title: "18: Naomi",
        pages: 293,
      },
      {
        title: "19: Alex",
        pages: 309,
      },
      {
        title: "20: Holden",
        pages: 327,
      },
      {
        title: "21: Amos",
        pages: 343,
      },
      {
        title: "22: Naomi",
        pages: 361,
      },
      {
        title: "23: Alex",
        pages: 377,
      },
      {
        title: "24: Holden",
        pages: 395,
      },
      {
        title: "25: Amos",
        pages: 411,
      },
      {
        title: "26: Naomi",
        pages: 429,
      },
    ],
  },
  {
    id: 6,
    title: "Babylon's Ashes",
    author: "James S. A. Corey",
    pages: 608,
    duration: "19h 58m",
    date: "December 6, 2016",
    isbn: "978-0-316-33474-7",
    chapters: [
      {
        title: "Prologue",
        pages: 1,
      },
      {
        title: "1: Holden",
        pages: 3,
      },
      {
        title: "2: Michio",
        pages: 21,
      },
      {
        title: "3: Holden",
        pages: 39,
      },
      {
        title: "4: Michio",
        pages: 55,
      },
      {
        title: "5: Holden",
        pages: 71,
      },
      {
        title: "6: Michio",
        pages: 89,
      },
      {
        title: "7: Holden",
        pages: 105,
      },
      {
        title: "8: Michio",
        pages: 123,
      },
      {
        title: "9: Holden",
        pages: 139,
      },
      {
        title: "10: Michio",
        pages: 157,
      },
      {
        title: "11: Holden",
        pages: 173,
      },
      {
        title: "12: Michio",
        pages: 191,
      },
      {
        title: "13: Holden",
        pages: 207,
      },
      {
        title: "14: Michio",
        pages: 225,
      },
      {
        title: "15: Holden",
        pages: 241,
      },
      {
        title: "16: Michio",
        pages: 259,
      },
      {
        title: "17: Holden",
        pages: 275,
      },
      {
        title: "18: Michio",
        pages: 293,
      },
      {
        title: "19: Holden",
        pages: 309,
      },
      {
        title: "20: Michio",
        pages: 327,
      },
      {
        title: "21: Holden",
        pages: 343,
      },
      {
        title: "22: Michio",
        pages: 361,
      },
      {
        title: "23: Holden",
        pages: 377,
      },
      {
        title: "24: Michio",
        pages: 395,
      },
      {
        title: "25: Holden",
        pages: 411,
      },
      {
        title: "26: Michio",
        pages: 429,
      },
    ],
  },
  {
    id: 7,
    title: "Persepolis Rising",
    author: "James S. A. Corey",
    pages: 560,
    duration: "20h 34m",
    date: "December 5, 2017",
    isbn: "978-0-316-33283-5",
    chapters: [
      {
        title: "Prologue",
        pages: 1,
      },
      {
        title: "1: Holden",
        pages: 3,
      },
      {
        title: "2: Duarte",
        pages: 21,
      },
      {
        title: "3: Holden",
        pages: 39,
      },
      {
        title: "4: Duarte",
        pages: 55,
      },
      {
        title: "5: Holden",
        pages: 71,
      },
      {
        title: "6: Duarte",
        pages: 89,
      },
      {
        title: "7: Holden",
        pages: 105,
      },
      {
        title: "8: Duarte",
        pages: 123,
      },
      {
        title: "9: Holden",
        pages: 139,
      },
      {
        title: "10: Duarte",
        pages: 157,
      },
      {
        title: "11: Holden",
        pages: 173,
      },
      {
        title: "12: Duarte",
        pages: 191,
      },
      {
        title: "13: Holden",
        pages: 207,
      },
      {
        title: "14: Duarte",
        pages: 225,
      },
      {
        title: "15: Holden",
        pages: 241,
      },
      {
        title: "16: Duarte",
        pages: 259,
      },
      {
        title: "17: Holden",
        pages: 275,
      },
      {
        title: "18: Duarte",
        pages: 293,
      },
      {
        title: "19: Holden",
        pages: 309,
      },
      {
        title: "20: Duarte",
        pages: 327,
      },
      {
        title: "21: Holden",
        pages: 343,
      },
      {
        title: "22: Duarte",
        pages: 361,
      },
      {
        title: "23: Holden",
        pages: 377,
      },
      {
        title: "24: Duarte",
        pages: 395,
      },
      {
        title: "25: Holden",
        pages: 411,
      },
      {
        title: "26: Duarte",
        pages: 429,
      },
    ],
  },
  {
    id: 8,
    title: "Tiamat's Wrath",
    author: "James S. A. Corey",
    pages: 544,
    duration: "19h 8m",
    date: "March 26, 2019",
    isbn: "978-0-316-33286-6",
    chapters: [
      {
        title: "Prologue",
        pages: 1,
      },
      {
        title: "1: Elvi",
        pages: 3,
      },
      {
        title: "2: Holden",
        pages: 21,
      },
      {
        title: "3: Elvi",
        pages: 39,
      },
      {
        title: "4: Holden",
        pages: 55,
      },
      {
        title: "5: Elvi",
        pages: 71,
      },
      {
        title: "6: Holden",
        pages: 89,
      },
      {
        title: "7: Elvi",
        pages: 105,
      },
      {
        title: "8: Holden",
        pages: 123,
      },
      {
        title: "9: Elvi",
        pages: 139,
      },
      {
        title: "10: Holden",
        pages: 157,
      },
      {
        title: "11: Elvi",
        pages: 173,
      },
      {
        title: "12: Holden",
        pages: 191,
      },
      {
        title: "13: Elvi",
        pages: 207,
      },
      {
        title: "14: Holden",
        pages: 225,
      },
      {
        title: "15: Elvi",
        pages: 241,
      },
      {
        title: "16: Holden",
        pages: 259,
      },
      {
        title: "17: Elvi",
        pages: 275,
      },
      {
        title: "18: Holden",
        pages: 293,
      },
      {
        title: "19: Elvi",
        pages: 309,
      },
      {
        title: "20: Holden",
        pages: 327,
      },
      {
        title: "21: Elvi",
        pages: 343,
      },
      {
        title: "22: Holden",
        pages: 361,
      },
      {
        title: "23: Elvi",
        pages: 377,
      },
      {
        title: "24: Holden",
        pages: 395,
      },
      {
        title: "25: Elvi",
        pages: 411,
      },
      {
        title: "26: Holden",
        pages: 429,
      },
    ],
  },
  {
    id: 9,
    title: "Leviathan Falls",
    author: "James S. A. Corey",
    pages: 528,
    duration: "19h 40m",
    date: "November 30, 2021[1]",
    isbn: "978-0-316-33291-0",
    chapters: [
      {
        title: "Prologue",
        pages: 1,
      },
      {
        title: "1: Holden",
        pages: 3,
      },
      {
        title: "2: Duarte",
        pages: 21,
      },
      {
        title: "3: Holden",
        pages: 39,
      },
      {
        title: "4: Duarte",
        pages: 55,
      },
      {
        title: "5: Holden",
        pages: 71,
      },
      {
        title: "6: Duarte",
        pages: 89,
      },
      {
        title: "7: Holden",
        pages: 105,
      },
      {
        title: "8: Duarte",
        pages: 123,
      },
      {
        title: "9: Holden",
        pages: 139,
      },
      {
        title: "10: Duarte",
        pages: 157,
      },
      {
        title: "11: Holden",
        pages: 173,
      },
      {
        title: "12: Duarte",
        pages: 191,
      },
      {
        title: "13: Holden",
        pages: 207,
      },
      {
        title: "14: Duarte",
        pages: 225,
      },
      {
        title: "15: Holden",
        pages: 241,
      },
      {
        title: "16: Duarte",
        pages: 259,
      },
      {
        title: "17: Holden",
        pages: 275,
      },
      {
        title: "18: Duarte",
        pages: 293,
      },
      {
        title: "19: Holden",
        pages: 309,
      },
      {
        title: "20: Duarte",
        pages: 327,
      },
      {
        title: "21: Holden",
        pages: 343,
      },
      {
        title: "22: Duarte",
        pages: 361,
      },
      {
        title: "23: Holden",
        pages: 377,
      },
      {
        title: "24: Duarte",
        pages: 395,
      },
      {
        title: "25: Holden",
        pages: 411,
      },
      {
        title: "26: Duarte",
        pages: 429,
      },
    ],
  },
];

async function findBook(isbn: string) {
  await delay(2000);
  return books.find((v) => v.isbn === isbn);
}

async function findBooks() {
  return books;
}

export { findBook, findBooks };
