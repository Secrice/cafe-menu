import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, LogOut, Star, LogIn } from 'lucide-react';
import { Hanko, register } from '@teamhanko/hanko-elements';
import { loadUserData, saveItems, saveHistory, saveFavorites } from './lib/supabase';

const hankoApi = import.meta.env.VITE_HANKO_API_URL;
const hanko = new Hanko(hankoApi);

const SAVE_DELAY = 800;

const App = () => {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [pendingClear, setPendingClear] = useState(false);
  const [pendingHistoryClear, setPendingHistoryClear] = useState(false);
  const [poppingId, setPoppingId] = useState(null);
  const [favInput, setFavInput] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const inputRef = useRef(null);
  const favInputRef = useRef(null);
  const itemsSaveTimer = useRef(null);
  const historySaveTimer = useRef(null);
  const favoritesSaveTimer = useRef(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setUserId('dev-user');
      return;
    }

    register(hankoApi).catch(console.error);

    hanko.getUser()
      .then(user => setUserId(user.id))
      .catch(() => {});

    hanko.onSessionCreated(async () => {
      const user = await hanko.getUser();
      setUserId(user.id);
      setShowLogin(false);
    });

    const resetState = () => {
      setUserId(null);
      setItems([]);
      setHistory([]);
      setFavorites([]);
      setFavInput(null);
      setDataLoaded(true);
    };

    hanko.onSessionExpired(resetState);
    hanko.onUserLoggedOut(resetState);
  }, []);

  // 로그인 후 Supabase에서 데이터 로드
  useEffect(() => {
    if (!userId || userId === 'dev-user') return;
    setDataLoaded(false);
    loadUserData(userId).then(({ items, history, favorites }) => {
      setItems(items);
      setHistory(history);
      setFavorites(favorites);
      setDataLoaded(true);
    });
  }, [userId]);

  const scheduleSaveItems = useCallback((uid, newItems) => {
    clearTimeout(itemsSaveTimer.current);
    itemsSaveTimer.current = setTimeout(() => saveItems(uid, newItems), SAVE_DELAY);
  }, []);

  const scheduleSaveHistory = useCallback((uid, newHistory) => {
    clearTimeout(historySaveTimer.current);
    historySaveTimer.current = setTimeout(() => saveHistory(uid, newHistory), SAVE_DELAY);
  }, []);

  const scheduleSaveFavorites = useCallback((uid, newFavs) => {
    clearTimeout(favoritesSaveTimer.current);
    favoritesSaveTimer.current = setTimeout(() => saveFavorites(uid, newFavs), SAVE_DELAY);
  }, []);

  const updateItems = (newItems) => {
    setItems(newItems);
    if (userId && dataLoaded) scheduleSaveItems(userId, newItems);
  };

  const updateHistory = (newHistory) => {
    setHistory(newHistory);
    if (userId && dataLoaded) scheduleSaveHistory(userId, newHistory);
  };

  const updateFavorites = (newFavs) => {
    setFavorites(newFavs);
    if (userId && dataLoaded) scheduleSaveFavorites(userId, newFavs);
  };

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (favInput !== null && favInputRef.current) {
      favInputRef.current.focus();
      favInputRef.current.select();
    }
  }, [favInput]);

  const generateFavLabel = () =>
    items.map(it => it.name + (it.temp ? ` ${it.temp}` : '')).join(', ').slice(0, 40);

  const confirmSaveFavorite = (label) => {
    const trimmed = label.trim();
    if (!trimmed) { setFavInput(null); return; }
    const newFav = {
      id: crypto.randomUUID(),
      label: trimmed,
      items: items.map(({ name, count, temp }) => ({ name, count, temp })),
    };
    updateFavorites([...favorites, newFav]);
    setFavInput(null);
  };

  const deleteFavorite = (e, id) => {
    e.stopPropagation();
    updateFavorites(favorites.filter(f => f.id !== id));
  };

  const loadFavorite = (fav) => {
    updateItems(fav.items.map(it => ({ ...it, id: crypto.randomUUID() })));
  };

  const addItem = () => {
    const newItem = { id: crypto.randomUUID(), name: '', count: 1, temp: null };
    updateItems([...items, newItem]);
    setEditingId(newItem.id);
  };

  const addFromHistory = ({ name, temp }) => {
    const existingItem = items.find(item => item.name === name && item.temp === temp);
    if (existingItem) {
      triggerPop(existingItem.id);
      updateItems(items.map(item =>
        item.id === existingItem.id ? { ...item, count: Math.max(1, item.count + 1) } : item
      ));
      return;
    }
    updateItems([...items, { id: crypto.randomUUID(), name, count: 1, temp }]);
  };

  const setTempForItem = (id, value) => {
    updateItems(items.map(i => i.id === id ? { ...i, temp: i.temp === value ? null : value } : i));
  };

  const removeFromHistory = (e, index) => {
    e.stopPropagation();
    updateHistory(history.filter((_, i) => i !== index));
  };

  const finishEditing = (id, newName) => {
    const trimmedName = newName.trim();
    const item = items.find(i => i.id === id);
    if (!trimmedName) {
      if (item && !item.name) updateItems(items.filter(i => i.id !== id));
      setEditingId(null);
      return;
    }
    updateItems(items.map(i => (i.id === id ? { ...i, name: trimmedName } : i)));
    setEditingId(null);
    const temp = item?.temp ?? null;
    updateHistory([{ name: trimmedName, temp }, ...history.filter(h => !(h.name === trimmedName && h.temp === temp))].slice(0, 15));
  };

  const triggerPop = (id) => {
    setPoppingId(id);
    setTimeout(() => setPoppingId(null), 300);
  };

  const updateCount = (id, delta) => {
    triggerPop(id);
    updateItems(items.map(item =>
      item.id === id ? { ...item, count: Math.max(1, item.count + delta) } : item
    ));
  };

  const removeItem = id => updateItems(items.filter(item => item.id !== id));

  const handleClearClick = () => {
    if (pendingClear) {
      updateItems([]);
      setPendingClear(false);
    } else {
      setPendingClear(true);
      setTimeout(() => setPendingClear(false), 3000);
    }
  };

  const handleHistoryClearClick = () => {
    if (pendingHistoryClear) {
      updateHistory([]);
      setPendingHistoryClear(false);
    } else {
      setPendingHistoryClear(true);
      setTimeout(() => setPendingHistoryClear(false), 3000);
    }
  };

  const totalTypes = items.length;
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  if (!dataLoaded) {
    return (
      <div style={{
        minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--cream)',
      }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--warm-faint)', fontSize: '1rem' }}>
          메뉴 불러오는 중…
        </span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--cream)', paddingBottom: '7rem' }}>

      {showLogin && (
        <div
          onClick={() => setShowLogin(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            backgroundColor: 'rgba(40,25,15,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--cream)',
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '22rem',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowLogin(false)}
              style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '1.75rem', height: '1.75rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--warm-faint)',
                borderRadius: '0.375rem',
              }}
            >
              <X size={16} />
            </button>
            <hanko-auth />
          </div>
        </div>
      )}

      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'var(--espresso)',
        padding: '0 1.25rem',
        height: '3.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--espresso-light)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-myeongjo)',
          fontStyle: 'normal',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--cream)',
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}>
          메뉴 리스트
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleClearClick}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.7rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              padding: '0.35rem 0.75rem',
              borderRadius: '2rem',
              border: pendingClear ? '1px solid #ef4444' : '1px solid rgba(245,237,214,0.2)',
              color: pendingClear ? '#fca5a5' : 'var(--warm-faint)',
              backgroundColor: pendingClear ? 'rgba(239,68,68,0.12)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {pendingClear ? '한 번 더 누르면 초기화' : '전체 초기화'}
          </button>
          {userId ? (
            <button
              onClick={() => hanko.logout()}
              title="로그아웃"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '2rem', height: '2rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(184,168,152,0.4)',
                borderRadius: '0.375rem',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--warm-faint)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(184,168,152,0.4)'}
            >
              <LogOut size={14} />
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              title="로그인"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '2rem', height: '2rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(184,168,152,0.4)',
                borderRadius: '0.375rem',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--warm-faint)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(184,168,152,0.4)'}
            >
              <LogIn size={14} />
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '40rem', margin: '0 auto' }}>

        {items.length > 0 && (
          <div style={{ borderBottom: '1px solid var(--paper-border)' }} />
        )}

        {items.length === 0 ? (
          <div style={{
            padding: '5rem 1.25rem',
            textAlign: 'center',
            color: 'var(--warm-faint)',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '1.1rem',
          }}>
            아직 메뉴가 없습니다
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((item, i) => (
              <li
                key={item.id}
                className="menu-item"
                style={{
                  animationDelay: `${i * 0.04}s`,
                  display: 'flex',
                  alignItems: editingId === item.id ? 'flex-start' : 'center',
                  padding: '0.875rem 1.25rem',
                  borderBottom: '1px solid var(--paper-border)',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cream-dark)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '0.8rem',
                  color: 'var(--warm-faint)',
                  width: '1.5rem',
                  flexShrink: 0,
                  marginRight: '0.75rem',
                }}>
                  {i + 1}
                </span>

                <div style={{ flex: 1, minWidth: 0, marginRight: '1rem' }}>
                  {editingId === item.id ? (
                    <div>
                      <input
                        key={item.id}
                        ref={inputRef}
                        type="text"
                        defaultValue={item.name}
                        onBlur={e => finishEditing(item.id, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') finishEditing(item.id, e.target.value);
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          borderBottom: '1.5px solid var(--terracotta)',
                          outline: 'none',
                          padding: '0.125rem 0',
                          fontSize: '1rem',
                          fontWeight: 500,
                          fontFamily: 'var(--font-sans)',
                          backgroundColor: 'transparent',
                          color: 'var(--warm-text)',
                        }}
                        placeholder="메뉴 이름"
                      />
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                        {[['hot', 'HOT', '#e84040'], ['ice', 'ICE', '#3b82f6']].map(([val, label, color]) => (
                          <button
                            key={val}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => setTempForItem(item.id, val)}
                            style={{
                              padding: '0.2rem 0.65rem',
                              borderRadius: '0.25rem',
                              border: `1.5px solid ${item.temp === val ? color : 'var(--paper-border)'}`,
                              backgroundColor: item.temp === val ? color : 'transparent',
                              color: item.temp === val ? 'white' : 'var(--warm-mid)',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingId(item.id)}
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 400,
                        fontFamily: 'var(--font-sans)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        color: item.name ? 'var(--warm-text)' : 'var(--warm-faint)',
                      }}
                    >
                      {item.temp && (
                        <span style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '0.25rem',
                          backgroundColor: item.temp === 'hot' ? '#e84040' : '#3b82f6',
                          color: 'white',
                          marginRight: '0.5rem',
                          letterSpacing: '0.05em',
                          flexShrink: 0,
                          fontFamily: 'var(--font-sans)',
                        }}>
                          {item.temp === 'hot' ? 'HOT' : 'ICE'}
                        </span>
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name || '이름을 입력하세요'}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.125rem',
                    border: '1px solid var(--paper-border)',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                  }}>
                    <button
                      onClick={() => updateCount(item.id, -1)}
                      style={{
                        width: '2rem', height: '2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--warm-mid)', fontSize: '1rem', fontWeight: 300,
                        transition: 'background-color 0.1s',
                      }}
                    >
                      −
                    </button>
                    <span
                      key={poppingId === item.id ? 'pop' : 'still'}
                      className={poppingId === item.id ? 'count-pop' : ''}
                      style={{
                        width: '2rem',
                        textAlign: 'center',
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.8rem',
                        fontWeight: 600,
                        color: 'var(--terracotta)',
                        lineHeight: '2rem',
                      }}
                    >
                      {item.count}
                    </span>
                    <button
                      onClick={() => updateCount(item.id, 1)}
                      style={{
                        width: '2rem', height: '2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--warm-mid)', fontSize: '1rem', fontWeight: 300,
                        transition: 'background-color 0.1s',
                      }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    title="삭제"
                    style={{
                      width: '1.75rem', height: '1.75rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--warm-faint)',
                      borderRadius: '0.375rem',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--warm-faint)'}
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div style={{ padding: '1rem 1.25rem' }}>
          <button
            onClick={addItem}
            style={{
              width: '100%',
              padding: '0.875rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              background: 'none',
              border: '1px dashed var(--paper-border)',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              fontWeight: 400,
              color: 'var(--warm-mid)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--terracotta)';
              e.currentTarget.style.color = 'var(--terracotta)';
              e.currentTarget.style.backgroundColor = 'rgba(196,98,45,0.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--paper-border)';
              e.currentTarget.style.color = 'var(--warm-mid)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Plus size={15} />
            새 메뉴 추가
          </button>

          {items.length > 0 && (
            <div style={{ marginTop: '0.625rem' }}>
              {favInput === null ? (
                <button
                  onClick={() => setFavInput(generateFavLabel())}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    background: 'none',
                    border: '1px solid transparent',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.775rem',
                    fontWeight: 400,
                    color: 'var(--warm-faint)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(196,98,45,0.25)';
                    e.currentTarget.style.color = 'var(--terracotta)';
                    e.currentTarget.style.backgroundColor = 'rgba(196,98,45,0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = 'var(--warm-faint)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Star size={12} />
                  즐겨찾기로 저장
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    ref={favInputRef}
                    defaultValue={favInput}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmSaveFavorite(favInputRef.current?.value ?? '');
                      if (e.key === 'Escape') setFavInput(null);
                    }}
                    placeholder="즐겨찾기 이름"
                    style={{
                      flex: 1,
                      border: 'none',
                      borderBottom: '1.5px solid var(--terracotta)',
                      outline: 'none',
                      padding: '0.25rem 0',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-sans)',
                      backgroundColor: 'transparent',
                      color: 'var(--warm-text)',
                    }}
                  />
                  <button
                    onClick={() => confirmSaveFavorite(favInputRef.current?.value ?? '')}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '2rem',
                      border: '1px solid var(--terracotta)',
                      backgroundColor: 'var(--terracotta)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-sans)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setFavInput(null)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '1.5rem', height: '1.5rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--warm-faint)',
                      borderRadius: '0.375rem',
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {favorites.length > 0 && (
          <div style={{ padding: '0 1.25rem' }}>
            <div style={{ borderTop: '1px solid var(--paper-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-myeongjo)',
                fontSize: '0.85rem',
                color: 'var(--warm-faint)',
                margin: '0 0 0.75rem 0',
                fontWeight: 400,
                display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}>
                <Star size={12} fill="currentColor" />
                즐겨찾기
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {favorites.map(fav => (
                  <div
                    key={fav.id}
                    onClick={() => loadFavorite(fav)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      border: '1px solid var(--paper-border)',
                      borderRadius: '0.75rem',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '0.5rem 0.5rem 0.5rem 0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      maxWidth: '100%',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(196,98,45,0.35)';
                      e.currentTarget.style.backgroundColor = 'rgba(196,98,45,0.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--paper-border)';
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.7)';
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.825rem',
                        fontWeight: 500,
                        color: 'var(--warm-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {fav.label}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.7rem',
                        color: 'var(--warm-faint)',
                        marginTop: '0.1rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {(() => {
                          const parts = fav.items.slice(0, 2).map(it => `${it.name}${it.temp ? ` ${it.temp}` : ''} ×${it.count}`);
                          const extra = fav.items.length - 2;
                          return extra > 0 ? `${parts.join(' · ')} 외 ${extra}개` : parts.join(' · ');
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteFavorite(e, fav.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        width: '1.5rem', height: '1.5rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--warm-faint)',
                        borderRadius: '0.375rem',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--warm-faint)'}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ padding: '0 1.25rem 3rem' }}>
            <div style={{ borderTop: '1px solid var(--paper-border)', paddingTop: '1rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '0.75rem',
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-myeongjo)',
                  fontStyle: 'normal',
                  fontSize: '0.85rem',
                  color: 'var(--warm-faint)',
                  margin: 0,
                  fontWeight: 400,
                }}>
                  최근 사용
                </h2>
                <button
                  onClick={handleHistoryClearClick}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.7rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: pendingHistoryClear ? '#ef4444' : 'var(--warm-faint)',
                    transition: 'color 0.15s',
                    padding: 0,
                  }}
                >
                  {pendingHistoryClear ? '한 번 더 누르면 삭제' : '전체 삭제'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {history.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex', alignItems: 'center',
                      border: '1px solid var(--paper-border)',
                      borderRadius: '2rem',
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      overflow: 'hidden',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--terracotta-light)';
                      e.currentTarget.style.backgroundColor = 'rgba(196,98,45,0.06)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--paper-border)';
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)';
                    }}
                  >
                    <button
                      onClick={() => addFromHistory(entry)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '0.3rem 0.5rem 0.3rem 0.75rem',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.8rem',
                        fontWeight: 400,
                        color: 'var(--warm-text)',
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                      }}
                    >
                      {entry.temp && (
                        <span style={{
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          padding: '0.08rem 0.3rem',
                          borderRadius: '0.2rem',
                          backgroundColor: entry.temp === 'hot' ? '#e84040' : '#3b82f6',
                          color: 'white',
                          letterSpacing: '0.05em',
                          lineHeight: 1.4,
                        }}>
                          {entry.temp === 'hot' ? 'HOT' : 'ICE'}
                        </span>
                      )}
                      {entry.name}
                    </button>
                    <button
                      onClick={(e) => removeFromHistory(e, index)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '0.3rem 0.5rem 0.3rem 0.125rem',
                        color: 'var(--warm-faint)',
                        display: 'flex', alignItems: 'center',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--warm-faint)'}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'var(--espresso)',
        zIndex: 20,
        borderTop: '1px solid var(--espresso-light)',
      }}>
        <div style={{
          maxWidth: '40rem', margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: '0.5rem',
        }}>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '2.25rem',
            fontWeight: 600,
            color: 'var(--cream)',
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}>
            {totalCount}
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.8rem',
            color: 'var(--warm-faint)',
            fontWeight: 300,
          }}>
            개
          </span>
          {totalTypes > 0 && (
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '0.8rem',
              color: 'rgba(184,168,152,0.5)',
              marginLeft: '0.25rem',
            }}>
              {totalTypes}종류
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;
