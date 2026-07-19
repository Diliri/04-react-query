// src/components/App/App.tsx
import { useState, useEffect } from "react";
import type { ComponentType } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import ReactPaginateModule from "react-paginate";
import type { ReactPaginateProps } from "react-paginate";

// Імпортуємо компоненти
import SearchBar from "../SearchBar/SearchBar";
import MovieGrid from "../MovieGrid/MovieGrid";
import Loader from "../Loader/Loader";
import ErrorMessage from "../ErrorMessage/ErrorMessage";
import MovieModal from "../MovieModal/MovieModal";

// Імпортуємо сервіс запитів та типи
import { fetchMovies } from "../../services/movieService";
import { type Movie } from "../../types/movie";

// Імпортуємо стилі
import css from "./App.module.css";

// Спеціальний імпорт ReactPaginate для Vite 8+, як вимагає ТЗ
type ModuleWithDefault<T> = { default: T };
const ReactPaginate = (
  ReactPaginateModule as unknown as ModuleWithDefault<ComponentType<ReactPaginateProps>>
).default;

export default function App() {
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Використовуємо TanStack Query замість useEffect та ручних стейтів
  const { data, isLoading, isError } = useQuery({
    queryKey: ["movies", query, page],
    queryFn: () => fetchMovies(query, page),
    enabled: query.length > 0, // запит не піде, поки query порожній
    placeholderData: keepPreviousData, // <-- ДЛЯ ПЛАВНОЇ ПАГІНАЦІЇ!
  });

  // Ефект для виведення тосту, якщо нічого не знайдено
  useEffect(() => {
    if (data && data.results.length === 0) {
      toast.error("No movies found for your request.");
    }
  }, [data]);

  // Обробник відправки форми пошуку
  const handleSearch = (newQuery: string): void => {
    if (newQuery.trim() === "") {
      toast.error("Please enter a search term!");
      return;
    }
    setQuery(newQuery);
    setPage(1); // Скидаємо сторінку на 1 при новому пошуку
  };

  const openModal = (movie: Movie): void => {
    setSelectedMovie(movie);
  };

  const closeModal = (): void => {
    setSelectedMovie(null);
  };

  const movies = data?.results || [];
  const totalPages = data?.total_pages || 0;

  return (
    <>
      <SearchBar onSubmit={handleSearch} />

      {isLoading && <Loader />}
      
      {isError && <ErrorMessage />}
      
      {movies.length > 0 && !isLoading && (
        <MovieGrid movies={movies} onSelect={openModal} />
      )}

      {/* Пагінація рендериться, тільки якщо сторінок більше ніж 1 */}
      {totalPages > 1 && !isLoading && (
        <ReactPaginate
          pageCount={totalPages}
          pageRangeDisplayed={5}
          marginPagesDisplayed={1}
          onPageChange={({ selected }) => setPage(selected + 1)}
          forcePage={page - 1}
          containerClassName={css.pagination}
          activeClassName={css.active}
          nextLabel="→"
          previousLabel="←"
        />
      )}

      <Toaster position="top-right" />

      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={closeModal} />
      )}
    </>
  );
}