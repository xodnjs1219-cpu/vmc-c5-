'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = '검색...' }: SearchBarProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSearch = () => {
    const trimmed = input.trim();

    if (!trimmed) {
      setError('검색어를 입력하세요');
      return;
    }

    if (trimmed.length < 2) {
      setError('검색어는 최소 2자 이상이어야 합니다');
      return;
    }

    if (trimmed.length > 50) {
      setError('검색어는 최대 50자 이하여야 합니다');
      return;
    }

    setError('');
    onSearch(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={handleSearch} size="icon" variant="default">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {error && (
        <div role="alert" className="text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
