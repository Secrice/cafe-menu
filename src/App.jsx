import React, { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';

const App = () => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('menuItems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('menuHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [editingId, setEditingId] = useState(null);
  const [pendingClear, setPendingClear] = useState(false);
  const [pendingHistoryClear, setPendingHistoryClear] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('menuItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('menuHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const addItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      name: '',
      count: 1,
    };
    setItems([...items, newItem]);
    setEditingId(newItem.id);
  };

  const addFromHistory = (name) => {
    const existingItem = items.find(item => item.name === name);
    if (existingItem) {
      updateCount(existingItem.id, 1);
      return;
    }
    const newItem = { id: crypto.randomUUID(), name, count: 1 };
    setItems([...items, newItem]);
  };

  const removeFromHistory = (e, name) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h !== name));
  };

  const finishEditing = (id, newName) => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      const item = items.find(i => i.id === id);
      if (item && !item.name) {
        setItems(items.filter(i => i.id !== id));
      }
      setEditingId(null);
      return;
    }

    setItems(items.map(item => (item.id === id ? { ...item, name: trimmedName } : item)));
    setEditingId(null);

    setHistory(prev => {
      const filtered = prev.filter(h => h !== trimmedName);
      return [trimmedName, ...filtered].slice(0, 15);
    });
  };

  const updateCount = (id, delta) => {
    setItems(
      items.map(item =>
        item.id === id ? { ...item, count: Math.max(1, item.count + delta) } : item
      )
    );
  };

  const removeItem = id => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleClearClick = () => {
    if (pendingClear) {
      setItems([]);
      setPendingClear(false);
    } else {
      setPendingClear(true);
      setTimeout(() => setPendingClear(false), 3000);
    }
  };

  const handleHistoryClearClick = () => {
    if (pendingHistoryClear) {
      setHistory([]);
      setPendingHistoryClear(false);
    } else {
      setPendingHistoryClear(true);
      setTimeout(() => setPendingHistoryClear(false), 3000);
    }
  };

  const totalTypes = items.length;
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-40">
      <header className="p-4 border-b sticky top-0 bg-white/80 backdrop-blur-sm z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">메뉴 리스트</h1>
      </header>

      <main className="max-w-2xl mx-auto">
        {items.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            등록된 메뉴가 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map(item => (
              <li key={item.id} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                  {editingId === item.id ? (
                    <input
                      key={item.id}
                      ref={inputRef}
                      type="text"
                      defaultValue={item.name}
                      onBlur={e => finishEditing(item.id, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') finishEditing(item.id, e.target.value);
                      }}
                      className="w-full border-b-2 border-blue-600 outline-none py-1 text-lg font-semibold bg-transparent"
                      placeholder="메뉴 이름 입력"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingId(item.id)}
                      className="text-lg font-medium cursor-pointer truncate"
                    >
                      {item.name || <span className="text-gray-300 italic">이름을 입력하세요</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => updateCount(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-white active:bg-gray-200 transition-colors font-bold text-gray-600"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-blue-600">
                      {item.count}
                    </span>
                    <button
                      onClick={() => updateCount(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-white active:bg-gray-200 transition-colors font-bold text-gray-600"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="p-4 mt-2">
          <button
            onClick={addItem}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="h-5 w-5" />
            새 메뉴 추가
          </button>
        </div>

        {history.length > 0 && (
          <div className="px-4 pb-10">
            <div className="flex justify-between items-center mb-3 ml-1">
              <h2 className="text-sm font-semibold text-gray-400">최근 사용한 메뉴</h2>
              <button
                onClick={handleHistoryClearClick}
                className={`text-xs transition-colors ${
                  pendingHistoryClear
                    ? 'text-red-500 font-semibold'
                    : 'text-gray-300 hover:text-red-400'
                }`}
              >
                {pendingHistoryClear ? '한 번 더 누르면 삭제' : '전체 기록 삭제'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((name, index) => (
                <div
                  key={index}
                  className="group flex items-center bg-gray-50 border border-gray-100 rounded-full hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95"
                >
                  <button
                    onClick={() => addFromHistory(name)}
                    className="pl-3 pr-1 py-1.5 text-sm text-gray-600 group-hover:text-blue-600 font-medium"
                  >
                    {name}
                  </button>
                  <button
                    onClick={(e) => removeFromHistory(e, name)}
                    className="pr-2 pl-1 py-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    title="히스토리에서 삭제"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-2xl mx-auto p-4 pb-safe flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">총 {totalTypes}종류</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-400 font-medium">총 수량</span>
              <span className="text-xl font-black text-blue-600">{totalCount}개</span>
            </div>
          </div>
          <button
            onClick={handleClearClick}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              pendingClear
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'text-red-400 hover:bg-red-50'
            }`}
          >
            {pendingClear ? '한 번 더 누르면 초기화' : '전체 초기화'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
