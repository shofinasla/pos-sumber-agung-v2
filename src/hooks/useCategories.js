import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services/categoryService';

export const useCategories = (initialSearch = '') => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(initialSearch);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await categoryService.getCategories(search);
    if (err) {
      setError(err.message || 'Gagal memuat daftar kategori.');
      setCategories([]);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await categoryService.getCategories(search);
      if (!isMounted) return;
      if (err) {
        setError(err.message || 'Gagal memuat daftar kategori.');
        setCategories([]);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [search]);

  return {
    categories,
    loading,
    error,
    search,
    setSearch,
    refreshCategories: fetchCategories,
  };
};
