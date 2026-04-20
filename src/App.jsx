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
    const newItem = { id: crypto.randomUUID(), name: '', count: 1 };
    setItems([...items, newItem]);
    setEditingId(newItem.id);
  };

  const addFromHistory = (name) => {
    const existingItem = items.find(item => item.name === name);
    if (existingItem) {
      updateCount(existingItem.id, 1);
      return;
    }
    setItems([...items, { id: crypto.randomUUID(), name, count: 1 }]);
  };

  const removeFromHistory = (e, name) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h !== name));
  };

  const finishEditing = (id, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      const item = items.find(i => i.id === id);
      if (item && !item.name) setItems(items.filter(i => i.id !== id));
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
    setItems(items.map(item =>
      item.id === id ? { ...item, count: Math.max(1, item.count + delta) } : item
    ));
  };

  const removeItem = id => setItems(items.filter(item => item.id !== id));

  const handleClearClick = () => {
    if (pendingClear) {
      setItems([]);
      setPendingClear(false);
      window.location.reload();
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
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-40">
      {/* 헤더 */}
      <header className="px-5 py-4 sticky top-0 bg-orange-500 z-10 flex justify-between items-center">
        <h1 className="text-lg font-semibold tracking-tight text-white">메뉴 리스트</h1>
        <button
          onClick={handleClearClick}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
            pendingClear
              ? 'bg-red-600 text-white'
              : 'text-orange-100 hover:bg-orange-600 hover:text-white'
          }`}
        >
          {pendingClear ? '한 번 더 누르면 초기화' : '전체 초기화'}
        </button>
      </header>

      <main className="max-w-2xl mx-auto">
        {items.length === 0 ? (
          <div className="py-24 text-center text-stone-500 text-sm">
            등록된 메뉴가 없습니다.
          </div>
        ) : (
          <ul>
            {items.map((item, i) => (
              <li
                key={item.id}
                className={`flex items-center px-5 py-3.5 hover:bg-stone-100 transition-colors ${
                  i !== 0 ? 'border-t border-stone-200' : ''
                }`}
              >
                {/* 이름 */}
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
                      className="w-full border-b border-orange-400 outline-none py-0.5 text-base font-semibold bg-transparent text-stone-900 placeholder:text-stone-500"
                      placeholder="메뉴 이름 입력"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingId(item.id)}
                      className="text-base font-semibold cursor-pointer truncate text-stone-900"
                    >
                      {item.name || (
                        <span className="text-stone-500 font-normal">이름을 입력하세요</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 수량 조절 */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-stone-200 rounded-lg px-1 py-1">
                    <button
                      onClick={() => updateCount(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-stone-100 active:bg-stone-300 transition-colors text-stone-700 font-semibold text-base"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-orange-600">
                      {item.count}
                    </span>
                    <button
                      onClick={() => updateCount(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-stone-100 active:bg-stone-300 transition-colors text-stone-700 font-semibold text-base"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
                    title="삭제"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 메뉴 추가 버튼 */}
        <div className="px-5 py-4">
          <button
            onClick={addItem}
            className="w-full py-3.5 border border-dashed border-stone-400 rounded-xl text-stone-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            새 메뉴 추가
          </button>
        </div>

        {/* 히스토리 */}
        {history.length > 0 && (
          <div className="px-5 pb-10">
            <div className="bg-stone-100/80 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-semibold text-stone-600 uppercase tracking-wider">최근 사용</h2>
                <button
                  onClick={handleHistoryClearClick}
                  className={`text-xs transition-colors ${
                    pendingHistoryClear ? 'text-red-500 font-medium' : 'text-stone-400 hover:text-red-500'
                  }`}
                >
                  {pendingHistoryClear ? '한 번 더 누르면 삭제' : '전체 삭제'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {history.map((name, index) => (
                  <div
                    key={index}
                    className="group flex items-center bg-white border border-stone-300 rounded-full shadow-sm hover:border-orange-300 hover:bg-orange-50 transition-all active:scale-95"
                  >
                    <button
                      onClick={() => addFromHistory(name)}
                      className="pl-3 pr-1 py-1.5 text-sm text-stone-700 group-hover:text-orange-600 font-medium"
                    >
                      {name}
                    </button>
                    <button
                      onClick={(e) => removeFromHistory(e, name)}
                      className="pr-2 pl-0.5 py-1.5 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 하단 바 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-orange-500 z-20">
        <div className="max-w-2xl mx-auto px-5 py-3.5 pb-safe flex flex-col items-center">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white">{totalCount}</span>
            <span className="text-sm text-orange-100">개</span>
            <span className="text-xs text-orange-200 ml-1">{totalTypes}종류</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
