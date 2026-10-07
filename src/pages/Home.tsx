import { Link } from "react-router";
import { bsToString, formatAdDate, formatBsDate, todayAD, todayBS } from "../lib/nepaliDate";

const cards = [
  {
    to: "/converter",
    title: "BS ↔ AD Date Converter",
    description:
      "Convert any Bikram Sambat date to English and vice versa, instantly.",
    cta: "Open converter",
  },
  {
    to: "/patro",
    title: "Nepali Patro",
    description:
      "Browse the Bikram Sambat calendar month by month with English dates.",
    cta: "Open patro",
  },
];

const Home = () => {
  const bsToday = bsToString(todayBS());
  const adToday = todayAD();

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900">Nepali Patro</h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          A web based Nepali patro and BS to AD date converter, built with
          Bikram Sambat date utilities.
        </p>

        <p className="mt-4 text-sm text-gray-500">
          Today: <span className="font-semibold text-gray-700">{formatBsDate(bsToday)}</span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="font-semibold text-gray-700">{formatAdDate(adToday)}</span>
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-xl border bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
              {card.title}
            </h2>
            <p className="mt-3 text-gray-600">{card.description}</p>
            <span className="mt-5 inline-block text-sm font-medium text-blue-600">
              {card.cta} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Home;
