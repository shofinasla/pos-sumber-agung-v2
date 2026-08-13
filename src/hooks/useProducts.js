import { useState, useEffect, useCallback, useRef } from 'react';
import { productService } from '../services/productService';

export const useProducts = ({
  initialPage = 1,
  initialLimit = 10,
  initialCategoryId = '',
  initialStatusFilter = 'all',
  initialStockFilter = 'all',
} = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [stockFilter, setStockFilter] = useState(initialStockFilter);

  // Pagination totals
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 300ms Debounce timer for search
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search term
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  // Reset page to 1 whenever filters change
  const handleCategoryChange = (catId) => {
    setCategoryId(catId);
    setPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleStockFilterChange = (stock) => {
    setStockFilter(stock);
    setPage(1);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await productService.getProducts({
      page,
      limit,
      search: debouncedSearch,
      categoryId,
      statusFilter,
      stockFilter,
    });

    if (result.error) {
      setError(result.error.message || 'Gagal memuat daftar produk.');
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
    } else {
      setProducts(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    }
    setLoading(false);
  }, [page, limit, debouncedSearch, categoryId, statusFilter, stockFilter]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError(null);

      const result = await productService.getProducts({
        page,
        limit,
        search: debouncedSearch,
        categoryId,
        statusFilter,
        stockFilter,
      });

      if (!isMounted) return;

      if (result.error) {
        setError(result.error.message || 'Gagal memuat daftar produk.');
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      } else {
        setProducts(result.data || []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
      setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [page, limit, debouncedSearch, categoryId, statusFilter, stockFilter]);

  return {
    products,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    search,
    categoryId,
    statusFilter,
    stockFilter,
    setPage,
    setLimit,
    setSearch,
    setCategoryId: handleCategoryChange,
    setStatusFilter: handleStatusFilterChange,
    setStockFilter: handleStockFilterChange,
    refreshProducts: fetchProducts,
  };
};
