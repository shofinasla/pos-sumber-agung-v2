import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Local storage key for demo fallback mode
const DEMO_CATEGORIES_KEY = 'tb_sa_demo_categories';

// Initial demo seed categories
const INITIAL_DEMO_CATEGORIES = [
  { id: 'c1111111-1111-1111-1111-111111111111', name: 'Semen & Pasir', description: 'Semen PCC, Portland, Pasir Pasang, Pasir Cor, Semen Putih' },
  { id: 'c2222222-2222-2222-2222-222222222222', name: 'Besi & Logam', description: 'Besi Beton, Wiremesh, Kawat Bendrat, Baja Ringan, Seng' },
  { id: 'c3333333-3333-3333-3333-333333333333', name: 'Cat & Coating', description: 'Cat Tembok, Cat Kayu/Besi, Thinner, Kuas, Roll Cat' },
  { id: 'c4444444-4444-4444-4444-444444444444', name: 'Pipa & Plambing', description: 'Pipa PVC, Kran Air, Fitting Knee, Lem Pipa, Sanitari' },
  { id: 'c5555555-5555-5555-5555-555555555555', name: 'Kelistrikan & Alat', description: 'Kabel NYM, Saklar, Stop Kontak, Lampu LED, Tang, Martil' },
  { id: 'c6666666-6666-6666-6666-666666666666', name: 'Kayu & Triplek', description: 'Triplek 9mm/12mm, Kayu Meranti, Usuk, Reng' },
  { id: 'c7777777-7777-7777-7777-777777777777', name: 'Atap & Plafon', description: 'Genteng Metal, Asbes, Plafon PVC, Skrup Atap' },
  { id: 'c8888888-8888-8888-8888-888888888888', name: 'Keramik & Batu', description: 'Keramik Lantai 40x40, Batu Bata Merah, Batako' },
];

function getLocalCategories() {
  const stored = localStorage.getItem(DEMO_CATEGORIES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(DEMO_CATEGORIES_KEY, JSON.stringify(INITIAL_DEMO_CATEGORIES));
  return INITIAL_DEMO_CATEGORIES;
}

function saveLocalCategories(categories) {
  localStorage.setItem(DEMO_CATEGORIES_KEY, JSON.stringify(categories));
}

export const categoryService = {
  // Fetch all categories with product count
  async getCategories(search = '') {
    if (!isSupabaseConfigured) {
      let categories = getLocalCategories();
      if (search) {
        const q = search.toLowerCase();
        categories = categories.filter(
          (c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
        );
      }
      return { data: categories, error: null };
    }

    try {
      let query = supabase
        .from('categories')
        .select('*, products(count)')
        .order('name', { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Format response to include product_count integer
      const formatted = (data || []).map((cat) => ({
        ...cat,
        product_count: Array.isArray(cat.products) && cat.products[0]?.count ? cat.products[0].count : 0,
      }));

      return { data: formatted, error: null };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { data: null, error };
    }
  },

  // Create new category
  async createCategory(categoryData) {
    if (!categoryData.name || !categoryData.name.trim()) {
      return { data: null, error: new Error('Nama kategori wajib diisi.') };
    }

    if (!isSupabaseConfigured) {
      const categories = getLocalCategories();
      const exists = categories.some(
        (c) => c.name.toLowerCase() === categoryData.name.trim().toLowerCase()
      );
      if (exists) {
        return { data: null, error: new Error(`Kategori "${categoryData.name}" sudah ada.`) };
      }

      const newCategory = {
        id: `cat-${Date.now()}`,
        name: categoryData.name.trim(),
        description: categoryData.description ? categoryData.description.trim() : '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = [newCategory, ...categories];
      saveLocalCategories(updated);
      return { data: newCategory, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: categoryData.name.trim(),
            description: categoryData.description ? categoryData.description.trim() : null,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Kategori "${categoryData.name}" sudah terdaftar.`);
        }
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update category
  async updateCategory(id, categoryData) {
    if (!categoryData.name || !categoryData.name.trim()) {
      return { data: null, error: new Error('Nama kategori wajib diisi.') };
    }

    if (!isSupabaseConfigured) {
      const categories = getLocalCategories();
      const updated = categories.map((c) =>
        c.id === id
          ? {
              ...c,
              name: categoryData.name.trim(),
              description: categoryData.description ? categoryData.description.trim() : '',
              updated_at: new Date().toISOString(),
            }
          : c
      );
      saveLocalCategories(updated);
      return { data: { id, ...categoryData }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name.trim(),
          description: categoryData.description ? categoryData.description.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Kategori "${categoryData.name}" sudah terdaftar.`);
        }
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Delete category
  async deleteCategory(id) {
    if (!isSupabaseConfigured) {
      const categories = getLocalCategories();
      const filtered = categories.filter((c) => c.id !== id);
      saveLocalCategories(filtered);
      return { error: null };
    }

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};
