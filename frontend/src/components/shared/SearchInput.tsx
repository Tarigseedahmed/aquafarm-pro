'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SearchSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'pond' | 'fish' | 'equipment' | 'report' | 'setting';
  category: string;
  isRecent?: boolean;
  isPopular?: boolean;
}

interface SearchInputProps {
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  onSearch?: (query: string) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  showFilters?: boolean;
  className?: string;
}

export default function SearchInput({
  placeholder = "البحث في المزرعة...",
  suggestions = [],
  onSearch,
  onSuggestionClick,
  showFilters = true,
  className = ""
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock suggestions if none provided
  const mockSuggestions: SearchSuggestion[] = [
    {
      id: '1',
      title: 'الحوض الرئيسي',
      description: 'حوض البلطي - 2500 سمكة',
      type: 'pond',
      category: 'الأحواض',
      isRecent: true
    },
    {
      id: '2',
      title: 'جودة الماء',
      description: 'مراقبة مؤشرات جودة الماء',
      type: 'report',
      category: 'التقارير',
      isPopular: true
    },
    {
      id: '3',
      title: 'مضخة الأكسجين',
      description: 'معدات التهوية - الحوض 3',
      type: 'equipment',
      category: 'المعدات'
    },
    {
      id: '4',
      title: 'تقرير الإنتاج',
      description: 'تقرير الإنتاج الشهري',
      type: 'report',
      category: 'التقارير',
      isRecent: true
    },
    {
      id: '5',
      title: 'إعدادات النظام',
      description: 'تكوين إعدادات المزرعة',
      type: 'setting',
      category: 'الإعدادات'
    }
  ];

  const displaySuggestions = suggestions.length > 0 ? suggestions : mockSuggestions;

  useEffect(() => {
    if (query.trim()) {
      const filtered = displaySuggestions.filter(suggestion =>
        suggestion.title.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.description.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 5));
    } else {
      setFilteredSuggestions(displaySuggestions.slice(0, 5));
    }
  }, [query, displaySuggestions]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'pond': return '🐟';
      case 'fish': return '🐠';
      case 'equipment': return '⚙️';
      case 'report': return '📊';
      case 'setting': return '🔧';
      default: return '📄';
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'pond': return 'text-blue-600 bg-blue-50';
      case 'fish': return 'text-green-600 bg-green-50';
      case 'equipment': return 'text-purple-600 bg-purple-50';
      case 'report': return 'text-orange-600 bg-orange-50';
      case 'setting': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleSearch = (searchQuery: string) => {
    onSearch?.(searchQuery);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    onSuggestionClick?.(suggestion);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
      setIsFocused(false);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearQuery}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {filteredSuggestions.length > 0 ? (
              <div className="p-2">
                {filteredSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex-shrink-0 mr-3">
                      <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {suggestion.title}
                        </h4>
                        <div className="flex items-center space-x-1 rtl:space-x-reverse mr-2">
                          {suggestion.isRecent && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              حديث
                            </Badge>
                          )}
                          {suggestion.isPopular && (
                            <Badge variant="outline" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              شائع
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getSuggestionColor(suggestion.type)}`}>
                          {suggestion.category}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>لا توجد نتائج للبحث</p>
              </div>
            )}

            {showFilters && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">فلترة سريعة</span>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    فلترة متقدمة
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
