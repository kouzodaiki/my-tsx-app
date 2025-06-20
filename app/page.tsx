'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Menu, Clock, Users, User, Settings, Link, Send, RotateCcw, 
  CheckCircle, AlertCircle, Upload, Play, Pause, X, ChevronUp 
} from 'lucide-react';

// 型定義
interface ButtonConfig {
  groupName: string;
  talentName: string;
  memberColor: string;
  buttonName: string;
  buttonColor: string;
  ticketCount: number;
  seconds: number;
  marginSeconds: number;
  targetTalents: string[];
  distributionCount: number;
}

interface Timer {
  id: string;
  talentName: string;
  buttons: SelectedButton[];
  totalSeconds: number;
  remainingSeconds: number;
  totalTickets: number;
  isRunning: boolean;
  isPaused: boolean;
  pausedTime: number;
  startTime: Date;
  isAlert: boolean;
  isOvertime: boolean;
  overtimeSeconds: number;
  memberColor: string;
  wasOvertimeAlerted?: boolean;
}

interface SelectedButton {
  config: ButtonConfig;
  id: string;
  addedAt: Date;
  count?: number;
}

interface SessionData {
  dateTime: string;
  groupName: string;
  talentName: string;
  buttonName: string;
  distributionCount: number;
  seconds: number;
  overtimeSeconds: number;
  status: string;
  staffName: string;
}

interface Alert {
  id: string;
  talentName: string;
  memberColor: string;
  type: 'warning' | 'overtime';
  message: string;
  overtime?: number;
}

// スプレッドシート設定
const SPREADSHEET_CONFIG = {
  id: '1ySHZx8vPcgZ5UaE_ycSfZGq0KeOosS6xzKi1MJIOB0I',
  sheetName: 'ボタン設定',
  dataSheetName: 'data',
  endpoints: [
    'https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid=0',
    'https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet={SHEET}',
    'https://docs.google.com/spreadsheets/d/{ID}/export?format=csv'
  ],
  dataSubmissionUrl: 'https://script.google.com/macros/s/AKfycbxzQnX7oI_QOvl0crfktSdmTJ4HemFXVJtUm1GWRb4w09FvZ60-j93qwQtlXgCpv2nb/exec'
};

// 拡張されたフォールバック用テストデータ（同名タレントのテストを含む）
const FALLBACK_BUTTON_CONFIG: ButtonConfig[] = [
  // シンダーエラ - 3人
  {
    groupName: 'シンダーエラ',
    talentName: 'みかねあみ',
    memberColor: '#4169e1',
    buttonName: '写メ',
    buttonColor: '#b0c4de',
    ticketCount: 2,
    seconds: 40,
    marginSeconds: 10,
    targetTalents: ['みかねあみ'],
    distributionCount: 2
  },
  {
    groupName: 'シンダーエラ',
    talentName: 'みかねあみ',
    memberColor: '#4169e1',
    buttonName: '新規サインあり',
    buttonColor: '#ff6347',
    ticketCount: 0,
    seconds: 60,
    marginSeconds: 10,
    targetTalents: ['みかねあみ'],
    distributionCount: 0
  },
  {
    groupName: 'シンダーエラ',
    talentName: 'かわいりな',
    memberColor: '#ff69b4',
    buttonName: '写メ',
    buttonColor: '#ffb6c1',
    ticketCount: 2,
    seconds: 45,
    marginSeconds: 10,
    targetTalents: ['かわいりな'],
    distributionCount: 2
  },
  {
    groupName: 'シンダーエラ',
    talentName: 'かわいりな',
    memberColor: '#ff69b4',
    buttonName: 'おまかせサイン',
    buttonColor: '#ffd700',
    ticketCount: 1,
    seconds: 50,
    marginSeconds: 10,
    targetTalents: ['かわいりな'],
    distributionCount: 1
  },
  {
    groupName: 'シンダーエラ',
    talentName: 'さくらみお',
    memberColor: '#ff1493',
    buttonName: '写メ',
    buttonColor: '#ffe4e1',
    ticketCount: 3,
    seconds: 35,
    marginSeconds: 10,
    targetTalents: ['さくらみお'],
    distributionCount: 3
  },
  {
    groupName: 'シンダーエラ',
    talentName: 'さくらみお',
    memberColor: '#ff1493',
    buttonName: '新規サインあり',
    buttonColor: '#ff4500',
    ticketCount: 0,
    seconds: 55,
    marginSeconds: 10,
    targetTalents: ['さくらみお'],
    distributionCount: 0
  },

  // じゅじゅ - 3人
  {
    groupName: 'じゅじゅ',
    talentName: '日向まお',
    memberColor: '#ffc0cb',
    buttonName: 'コメント付き',
    buttonColor: '#ffff00',
    ticketCount: 4,
    seconds: 90,
    marginSeconds: 10,
    targetTalents: ['日向まお'],
    distributionCount: 4
  },
  {
    groupName: 'じゅじゅ',
    talentName: '日向まお',
    memberColor: '#ffc0cb',
    buttonName: '写メ',
    buttonColor: '#ffb6c1',
    ticketCount: 2,
    seconds: 40,
    marginSeconds: 10,
    targetTalents: ['日向まお'],
    distributionCount: 2
  },
  {
    groupName: 'じゅじゅ',
    talentName: 'あおいそら',
    memberColor: '#87ceeb',
    buttonName: '写メ',
    buttonColor: '#add8e6',
    ticketCount: 2,
    seconds: 45,
    marginSeconds: 10,
    targetTalents: ['あおいそら'],
    distributionCount: 2
  },
  {
    groupName: 'じゅじゅ',
    talentName: 'あおいそら',
    memberColor: '#87ceeb',
    buttonName: 'リクエストサイン',
    buttonColor: '#00bfff',
    ticketCount: 1,
    seconds: 70,
    marginSeconds: 10,
    targetTalents: ['あおいそら'],
    distributionCount: 1
  },
  {
    groupName: 'じゅじゅ',
    talentName: 'みどりな',
    memberColor: '#32cd32',
    buttonName: '写メ',
    buttonColor: '#90ee90',
    ticketCount: 3,
    seconds: 50,
    marginSeconds: 10,
    targetTalents: ['みどりな'],
    distributionCount: 3
  },
  {
    groupName: 'じゅじゅ',
    talentName: 'みどりな',
    memberColor: '#32cd32',
    buttonName: 'おまかせサイン',
    buttonColor: '#9acd32',
    ticketCount: 1,
    seconds: 60,
    marginSeconds: 10,
    targetTalents: ['みどりな'],
    distributionCount: 1
  },

  // テストグループA - 3人（同名タレント含む）
  {
    groupName: 'テストグループA',
    talentName: 'テストタレント',
    memberColor: '#ff6b6b',
    buttonName: 'テストボタンA1',
    buttonColor: '#ffe66d',
    ticketCount: 1,
    seconds: 30,
    marginSeconds: 10,
    targetTalents: ['テストタレント'],
    distributionCount: 1
  },
  {
    groupName: 'テストグループA',
    talentName: 'テストタレント',
    memberColor: '#ff6b6b',
    buttonName: 'テストボタンA2',
    buttonColor: '#ff9999',
    ticketCount: 2,
    seconds: 45,
    marginSeconds: 10,
    targetTalents: ['テストタレント'],
    distributionCount: 2
  },
  {
    groupName: 'テストグループA',
    talentName: 'アルファ',
    memberColor: '#4ecdc4',
    buttonName: 'テストボタンB1',
    buttonColor: '#95e1d3',
    ticketCount: 2,
    seconds: 40,
    marginSeconds: 10,
    targetTalents: ['アルファ'],
    distributionCount: 2
  },
  {
    groupName: 'テストグループA',
    talentName: 'ベータ',
    memberColor: '#a8e6cf',
    buttonName: 'テストボタンC1',
    buttonColor: '#c8f7c5',
    ticketCount: 1,
    seconds: 35,
    marginSeconds: 10,
    targetTalents: ['ベータ'],
    distributionCount: 1
  },

  // テストグループB - 3人（同名タレント含む）
  {
    groupName: 'テストグループB',
    talentName: 'テストタレント',
    memberColor: '#845ec2',
    buttonName: 'テストボタンD1',
    buttonColor: '#b39bc8',
    ticketCount: 3,
    seconds: 50,
    marginSeconds: 10,
    targetTalents: ['テストタレント'],
    distributionCount: 3
  },
  {
    groupName: 'テストグループB',
    talentName: 'テストタレント',
    memberColor: '#845ec2',
    buttonName: 'テストボタンD2',
    buttonColor: '#d4c5f9',
    ticketCount: 1,
    seconds: 25,
    marginSeconds: 10,
    targetTalents: ['テストタレント'],
    distributionCount: 1
  },
  {
    groupName: 'テストグループB',
    talentName: 'ガンマ',
    memberColor: '#f39c12',
    buttonName: 'テストボタンE1',
    buttonColor: '#f8c471',
    ticketCount: 2,
    seconds: 55,
    marginSeconds: 10,
    targetTalents: ['ガンマ'],
    distributionCount: 2
  },
  {
    groupName: 'テストグループB',
    talentName: 'デルタ',
    memberColor: '#e74c3c',
    buttonName: 'テストボタンF1',
    buttonColor: '#fadbd8',
    ticketCount: 1,
    seconds: 30,
    marginSeconds: 10,
    targetTalents: ['デルタ'],
    distributionCount: 1
  }
];

// ヘッダーマッピング
const HEADER_MAPPING: Record<string, string> = {
  'グループ名': 'groupName',
  'グループ': 'groupName',
  'group': 'groupName',
  'groupName': 'groupName',
  'タレント名': 'talentName',
  'タレント': 'talentName',
  'talent': 'talentName',
  'talentName': 'talentName',
  'メンバーカラー': 'memberColor',
  'メンバー色': 'memberColor',
  'カラー': 'memberColor',
  'color': 'memberColor',
  'memberColor': 'memberColor',
  'ボタン名': 'buttonName',
  'ボタン': 'buttonName',
  'button': 'buttonName',
  'buttonName': 'buttonName',
  'ボタンカラー': 'buttonColor',
  'ボタン色': 'buttonColor',
  'buttonColor': 'buttonColor',
  'チケット枚数': 'ticketCount',
  'チケット': 'ticketCount',
  'ticket': 'ticketCount',
  'ticketCount': 'ticketCount',
  '秒数': 'seconds',
  '時間': 'seconds',
  'time': 'seconds',
  'seconds': 'seconds',
  'マージン秒数': 'marginSeconds',
  'マージン秒': 'marginSeconds',
  'マージン': 'marginSeconds',
  'margin': 'marginSeconds',
  'marginSeconds': 'marginSeconds',
  '対象タレント': 'targetTalents',
  '対象': 'targetTalents',
  'target': 'targetTalents',
  'targetTalents': 'targetTalents',
  '配当枚数': 'distributionCount',
  '配当': 'distributionCount',
  'distribution': 'distributionCount',
  'distributionCount': 'distributionCount'
};

// ユーティリティ関数
const formatTime = (seconds: number): string => {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
};

const getTalentUniqueId = (groupName: string, talentName: string): string => {
  return `${groupName}__${talentName}`;
};

const parseTalentUniqueId = (uniqueId: string): { groupName: string; talentName: string } => {
  const parts = uniqueId.split('__');
  return {
    groupName: parts[0],
    talentName: parts[1]
  };
};

const getTalentDisplayName = (uniqueId: string): string => {
  const { talentName } = parseTalentUniqueId(uniqueId);
  return talentName;
};

const getTalentGroupName = (uniqueId: string): string => {
  const { groupName } = parseTalentUniqueId(uniqueId);
  return groupName;
};

const getContrastTextColor = (backgroundColor: string): string => {
  if (!backgroundColor) return '#ffffff';
  
  const hex = backgroundColor.replace('#', '');
  const fullHex = hex.length === 3 
    ? hex.split('').map(char => char + char).join('')
    : hex;
  
  const r = parseInt(fullHex.substr(0, 2), 16);
  const g = parseInt(fullHex.substr(2, 2), 16);
  const b = parseInt(fullHex.substr(4, 2), 16);
  
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
  return brightness > 128 ? '#000000' : '#ffffff';
};

const ChekiTimerPro: React.FC = () => {
  // State management
  const [userName, setUserName] = useState<string>('');
  const [isNameSet, setIsNameSet] = useState<boolean>(false);
  const [buttonConfigs, setButtonConfigs] = useState<ButtonConfig[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedIndividualTalents, setSelectedIndividualTalents] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedTalent, setSelectedTalent] = useState<string>('');
  const [currentScreen, setCurrentScreen] = useState<'group' | 'talent' | 'timer' | 'sendData'>('group');
  const [talentOrders, setTalentOrders] = useState<Record<string, string[]>>({});
  const [multiGroupTalentOrder, setMultiGroupTalentOrder] = useState<string[]>([]);
  const [activeTimers, setActiveTimers] = useState<Map<string, Timer>>(new Map());
  const [nextTimers, setNextTimers] = useState<Map<string, any[]>>(new Map());
  const [selectedButtons, setSelectedButtons] = useState<SelectedButton[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [swipedTalent, setSwipedTalent] = useState<string | null>(null);
  const [hiddenTalents, setHiddenTalents] = useState<Set<string>>(new Set());
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [isEditingStaffName, setIsEditingStaffName] = useState<boolean>(false);
  const [oneClickFinish, setOneClickFinish] = useState<boolean>(true);
  const [buttonLayoutTwoColumns, setButtonLayoutTwoColumns] = useState<boolean>(false);
  
  // UI state
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    callback?: (confirmed: boolean) => void;
  }>({ isOpen: false, title: '', message: '' });
  const [sendingStatus, setSendingStatus] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    progress: number;
    isSuccess: boolean;
    isError: boolean;
    errorMessage?: string;
  }>({ isOpen: false, title: '', message: '', progress: 0, isSuccess: false, isError: false });

  // ドラッグ&ドロップ・長押し関連の状態
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedIndex: number | null;
    draggedTalent: string | null;
    longPressTimer: NodeJS.Timeout | null;
    isLongPress: boolean;
    touchStartTime: number;
    touchStartPos: { x: number; y: number } | null;
  }>({
    isDragging: false,
    draggedIndex: null,
    draggedTalent: null,
    longPressTimer: null,
    isLongPress: false,
    touchStartTime: 0,
    touchStartPos: null
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 初期化処理
  useEffect(() => {
    const savedName = localStorage.getItem('timerUserName');
    if (savedName) {
      setUserName(savedName);
      setIsNameSet(true);
    }

    const savedData = localStorage.getItem('timerSessionData');
    if (savedData) {
      setSessionData(JSON.parse(savedData));
    }

    const savedOneClickFinish = localStorage.getItem('timerOneClickFinish');
    if (savedOneClickFinish !== null) {
      setOneClickFinish(JSON.parse(savedOneClickFinish));
    }

    const savedButtonLayout = localStorage.getItem('timerButtonLayoutTwoColumns');
    if (savedButtonLayout !== null) {
      setButtonLayoutTwoColumns(JSON.parse(savedButtonLayout));
    }

    // フォールバックデータを設定
    setButtonConfigs([...FALLBACK_BUTTON_CONFIG]);
    
    // デフォルトグループを設定
    const groups = [...new Set(FALLBACK_BUTTON_CONFIG.map(config => config.groupName))];
    if (groups.length > 0) {
      setSelectedGroup(groups[0]);
    }

    // タイマー処理を開始
    startTimerInterval();

    // 名前が設定されている場合は自動でメインアプリを表示
    if (savedName) {
      // スプレッドシートからデータを読み込む
      loadButtonConfig();
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (dragState.longPressTimer) {
        clearTimeout(dragState.longPressTimer);
      }
    };
  }, []);

  // タイマー処理
  const startTimerInterval = useCallback(() => {
    timerIntervalRef.current = setInterval(() => {
      setActiveTimers(currentTimers => {
        const newTimers = new Map(currentTimers);
        const alertsToUpdate: Alert[] = [];
        let hasActiveTimers = false;

        newTimers.forEach((timer, id) => {
          if (!timer.isRunning || timer.isPaused) {
            return;
          }

          hasActiveTimers = true;
          const elapsed = Math.floor((Date.now() - timer.startTime.getTime()) / 1000);
          const remaining = timer.totalSeconds - elapsed;

          timer.remainingSeconds = remaining;

          if (remaining <= 0) {
            timer.isOvertime = true;
            timer.overtimeSeconds = Math.abs(remaining);
            timer.remainingSeconds = 0;

            if (!timer.wasOvertimeAlerted) {
              playAlertSound();
              timer.wasOvertimeAlerted = true;
            }

            const { talentName } = parseTalentUniqueId(timer.talentName);
            alertsToUpdate.push({
              id,
              talentName: timer.talentName,
              memberColor: timer.memberColor,
              type: 'overtime',
              message: `交代です！`,
              overtime: Math.abs(remaining)
            });
          } else if (remaining <= timer.buttons[0].config.marginSeconds && !timer.isAlert) {
            timer.isAlert = true;

            const { talentName } = parseTalentUniqueId(timer.talentName);
            alertsToUpdate.push({
              id,
              talentName: timer.talentName,
              memberColor: timer.memberColor,
              type: 'warning',
              message: `まもなく終了`
            });
          }
        });

        if (alertsToUpdate.length > 0) {
          setAlerts(currentAlerts => {
            const newAlerts = [...currentAlerts];
            alertsToUpdate.forEach(newAlert => {
              const existingIndex = newAlerts.findIndex(alert => alert.talentName === newAlert.talentName);
              if (existingIndex !== -1) {
                newAlerts[existingIndex] = newAlert;
              } else {
                newAlerts.push(newAlert);
              }
            });
            return newAlerts;
          });
        }

        return newTimers;
      });
    }, 1000);
  }, []);

  // スプレッドシートからデータを読み込む
  const loadButtonConfig = async () => {
    try {
      console.log('=== ボタン設定読み込み開始 ===');
      
      // 実際の読み込み処理はここに実装
      // 現在はフォールバックデータを使用
      setButtonConfigs([...FALLBACK_BUTTON_CONFIG]);
      
      const groups = [...new Set(FALLBACK_BUTTON_CONFIG.map(config => config.groupName))];
      console.log('利用可能なグループ:', groups);
      
      if (groups.length > 0 && !selectedGroup) {
        setSelectedGroup(groups[0]);
      }
      
      alert('✅ テストデータで動作しています。');
      
    } catch (error) {
      console.error('スプレッドシートからの読み込みエラー:', error);
      setButtonConfigs([...FALLBACK_BUTTON_CONFIG]);
      alert('❌ スプレッドシートからの読み込みに失敗しました。テストデータで動作しています。');
    }
  };

  // ページトップにスクロール
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 音声アラート
  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
    } catch (error) {
      console.log('音の再生に失敗しました:', error);
    }
  };

  // 名前設定
  const setUserNameHandler = async (name: string) => {
    setUserName(name);
    setIsNameSet(true);
    localStorage.setItem('timerUserName', name);
    
    // スプレッドシートからデータを読み込む
    await loadButtonConfig();
  };

  // 画面遷移
  const showScreen = (screen: 'group' | 'talent' | 'timer' | 'sendData') => {
    setCurrentScreen(screen);
    setSwipedTalent(null); // 画面切り替え時にメニューを閉じる
  };

  // 単一グループ選択（従来の機能）
  const selectGroupHandler = (groupName: string) => {
    setSelectedGroup(groupName);
    
    const talents = [...new Set(
      buttonConfigs
        .filter(config => config.groupName === groupName)
        .map(config => getTalentUniqueId(config.groupName, config.talentName))
    )];
    
    if (!talentOrders[groupName]) {
      setTalentOrders(prev => ({
        ...prev,
        [groupName]: talents
      }));
    }
    
    // マルチ選択をリセット
    setSelectedGroups([]);
    setSelectedIndividualTalents([]);
    setMultiGroupTalentOrder([]);
    
    showScreen('talent');
  };

  // グループ追加
  const addGroup = (groupName: string) => {
    if (!selectedGroups.includes(groupName)) {
      setSelectedGroups(prev => [...prev, groupName]);
      
      // グループのタレント順序を初期化
      const talents = [...new Set(
        buttonConfigs
          .filter(config => config.groupName === groupName)
          .map(config => getTalentUniqueId(config.groupName, config.talentName))
      )];
      
      if (!talentOrders[groupName]) {
        setTalentOrders(prev => ({
          ...prev,
          [groupName]: talents
        }));
      }
      
      // マルチグループ順序をリセット
      setMultiGroupTalentOrder([]);
    }
  };

  // グループ削除
  const removeGroup = (groupName: string) => {
    setSelectedGroups(prev => prev.filter(group => group !== groupName));
    setMultiGroupTalentOrder([]);
  };

  // 個別タレント追加
  const addIndividualTalent = (talentUniqueId: string) => {
    if (!selectedIndividualTalents.includes(talentUniqueId)) {
      setSelectedIndividualTalents(prev => [...prev, talentUniqueId]);
      setMultiGroupTalentOrder([]);
    }
  };

  // 個別タレント削除
  const removeIndividualTalent = (talentUniqueId: string) => {
    setSelectedIndividualTalents(prev => prev.filter(talent => talent !== talentUniqueId));
    setMultiGroupTalentOrder([]);
  };

  // グループ展開/折りたたみ
  const toggleGroupExpansion = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // マルチグループタレント表示
  const showMultiGroupTalents = () => {
    // 順序情報はリセットしない（並び替えを保持）
    showScreen('talent');
  };

  // 選択リセット
  const resetSelections = () => {
    if (activeTimers.size > 0) {
      alert('動作中のタイマーがあるためリセットできません');
      return;
    }
    
    setSelectedGroups([]);
    setSelectedIndividualTalents([]);
    setMultiGroupTalentOrder([]);
    setExpandedGroups(new Set());
    setSelectedGroup('');
  };

  // 選択されたグループ・タレントから全タレントを取得
  const getAllTalentsFromSelectedGroups = (): string[] => {
    if (selectedGroups.length > 0 || selectedIndividualTalents.length > 0) {
      // 既に並び替え済みの順序がある場合は、それを基準とする
      if (multiGroupTalentOrder.length > 0) {
        // 現在の選択に含まれるタレントのみをフィルタ
        const currentValidTalents = multiGroupTalentOrder.filter(talentUniqueId => {
          const { groupName } = parseTalentUniqueId(talentUniqueId);
          const isInSelectedGroups = selectedGroups.includes(groupName);
          const isInSelectedTalents = selectedIndividualTalents.includes(talentUniqueId);
          return isInSelectedGroups || isInSelectedTalents;
        });
        
        // 新たに追加されたタレントを検出して末尾に追加
        const allExpectedTalents: string[] = [];
        
        // 選択されたグループのタレントを追加
        selectedGroups.forEach(group => {
          const groupTalents = talentOrders[group] || 
            [...new Set(buttonConfigs.filter(config => config.groupName === group).map(config => getTalentUniqueId(config.groupName, config.talentName)))];
          
          groupTalents.forEach(talentUniqueId => {
            if (!allExpectedTalents.includes(talentUniqueId)) {
              allExpectedTalents.push(talentUniqueId);
            }
          });
        });
        
        // 個別選択されたタレントを追加
        selectedIndividualTalents.forEach(talentUniqueId => {
          if (!allExpectedTalents.includes(talentUniqueId)) {
            allExpectedTalents.push(talentUniqueId);
          }
        });
        
        // 新しく追加されたタレントを既存の順序の末尾に追加
        const newTalents = allExpectedTalents.filter(talentUniqueId => !currentValidTalents.includes(talentUniqueId));
        const finalOrder = [...currentValidTalents, ...newTalents];
        
        // 順序が変更された場合のみ更新
        if (JSON.stringify(finalOrder) !== JSON.stringify(multiGroupTalentOrder)) {
          setMultiGroupTalentOrder(finalOrder);
        }
        
        return finalOrder.filter(talentUniqueId => !hiddenTalents.has(talentUniqueId));
      }
      
      // 初回の場合は新しい順序を作成
      const allTalents: string[] = [];
      
      // 選択されたグループのタレントを追加
      selectedGroups.forEach(group => {
        const groupTalents = talentOrders[group] || 
          [...new Set(buttonConfigs.filter(config => config.groupName === group).map(config => getTalentUniqueId(config.groupName, config.talentName)))];
        
        groupTalents.forEach(talentUniqueId => {
          if (!allTalents.includes(talentUniqueId)) {
            allTalents.push(talentUniqueId);
          }
        });
      });
      
      // 個別選択されたタレントを追加
      selectedIndividualTalents.forEach(talentUniqueId => {
        if (!allTalents.includes(talentUniqueId)) {
          allTalents.push(talentUniqueId);
        }
      });
      
      setMultiGroupTalentOrder(allTalents);
      return allTalents.filter(talentUniqueId => !hiddenTalents.has(talentUniqueId));
    }
    return [];
  };

  // タレント選択
  const selectTalentHandler = (talentUniqueId: string) => {
    const { groupName } = parseTalentUniqueId(talentUniqueId);
    setSelectedGroup(groupName);
    setSelectedTalent(talentUniqueId);
    setSelectedButtons([]);
    showScreen('timer');
  };

  // タレント操作メニューの表示/非表示
  const toggleTalentMenu = (talentUniqueId: string) => {
    console.log('toggleTalentMenu called for:', talentUniqueId);
    if (swipedTalent === talentUniqueId) {
      setSwipedTalent(null);
    } else {
      setSwipedTalent(talentUniqueId);
    }
  };

  // タレント非表示
  const hideTalent = (talentUniqueId: string) => {
    setHiddenTalents(prev => new Set([...prev, talentUniqueId]));
    setSwipedTalent(null);
  };

  // 長押し処理
  const handleLongPressStart = (talentUniqueId: string, index: number) => {
    const timer = setTimeout(() => {
      console.log('Long press detected for:', talentUniqueId);
      setDragState(prev => ({
        ...prev,
        isLongPress: true,
        draggedTalent: talentUniqueId,
        draggedIndex: index
      }));
      
      // 振動フィードバック
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);

    setDragState(prev => ({
      ...prev,
      longPressTimer: timer,
      touchStartTime: Date.now(),
      isLongPress: false
    }));
  };

  const handleLongPressEnd = () => {
    if (dragState.longPressTimer) {
      clearTimeout(dragState.longPressTimer);
    }
    
    const touchDuration = Date.now() - dragState.touchStartTime;
    
    // 短いタップの場合はメニュー表示
    if (touchDuration < 500 && !dragState.isLongPress && dragState.draggedTalent) {
      toggleTalentMenu(dragState.draggedTalent);
    }
    
    setDragState(prev => ({
      ...prev,
      longPressTimer: null,
      isLongPress: false,
      isDragging: false,
      draggedTalent: null,
      draggedIndex: null,
      touchStartTime: 0,
      touchStartPos: null
    }));
  };

  // ドラッグ&ドロップ処理
  const handleDragStart = (e: React.DragEvent, talentUniqueId: string, index: number) => {
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedTalent: talentUniqueId,
      draggedIndex: index
    }));
    
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.setData('application/x-talent', talentUniqueId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const draggedTalentUniqueId = e.dataTransfer.getData('application/x-talent');

    if (draggedIndex !== dropIndex) {
      reorderTalents(draggedIndex, dropIndex);
    }

    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedTalent: null,
      draggedIndex: null
    }));
  };

  // タレント順序変更
  const reorderTalents = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    if (selectedGroups.length > 0 || selectedIndividualTalents.length > 0) {
      // マルチグループ選択の場合
      const currentTalents = [...multiGroupTalentOrder];
      if (currentTalents.length === 0) return;

      const [movedTalent] = currentTalents.splice(fromIndex, 1);
      currentTalents.splice(toIndex, 0, movedTalent);
      setMultiGroupTalentOrder(currentTalents);
    } else {
      // 単一グループ選択の場合
      const currentTalents = [...(talentOrders[selectedGroup] || [])];
      if (currentTalents.length === 0) return;

      const [movedTalent] = currentTalents.splice(fromIndex, 1);
      currentTalents.splice(toIndex, 0, movedTalent);
      setTalentOrders(prev => ({
        ...prev,
        [selectedGroup]: currentTalents
      }));
    }

    console.log('タレント順序を更新しました');
  };

  // ボタン選択
  const toggleButton = (buttonName: string) => {
    const { groupName, talentName } = parseTalentUniqueId(selectedTalent);
    const buttonConfig = buttonConfigs.find(config => 
      config.groupName === groupName && 
      config.talentName === talentName && 
      config.buttonName === buttonName
    );
    
    if (!buttonConfig) return;
    
    const buttonId = `btn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newButton: SelectedButton = {
      config: buttonConfig,
      id: buttonId,
      addedAt: new Date()
    };
    
    setSelectedButtons(prev => [...prev, newButton]);
  };

  // タイマー開始
  const startTimer = () => {
    if (selectedButtons.length === 0) return;
    
    const totalSeconds = selectedButtons.reduce((sum, item) => sum + item.config.seconds, 0);
    const totalTickets = selectedButtons.reduce((sum, item) => sum + item.config.ticketCount, 0);
    
    const existingTimer = Array.from(activeTimers.values()).find(timer => timer.talentName === selectedTalent);
    
    if (existingTimer) {
      // 次のタイマーとして設定
      const currentQueue = nextTimers.get(selectedTalent) || [];
      const newTimer = {
        buttons: [...selectedButtons],
        totalSeconds,
        totalTickets,
        memberColor: selectedButtons[0].config.memberColor
      };
      setNextTimers(prev => new Map(prev.set(selectedTalent, [...currentQueue, newTimer])));
      
      const { talentName } = parseTalentUniqueId(selectedTalent);
      alert(`${talentName}の${currentQueue.length + 1}タイマーを設定しました。`);
    } else {
      // 新しいタイマーを開始
      const timerId = `${selectedTalent}_${Date.now()}`;
      const newTimer: Timer = {
        id: timerId,
        talentName: selectedTalent,
        buttons: [...selectedButtons],
        totalSeconds,
        remainingSeconds: totalSeconds,
        totalTickets,
        isRunning: true,
        isPaused: false,
        pausedTime: 0,
        startTime: new Date(),
        isAlert: false,
        isOvertime: false,
        overtimeSeconds: 0,
        memberColor: selectedButtons[0].config.memberColor
      };
      
      setActiveTimers(prev => new Map(prev.set(timerId, newTimer)));
    }
    
    setSelectedButtons([]);
    showScreen('talent');
  };

  // タイマー一時停止
  const pauseTimer = (timerId: string) => {
    setActiveTimers(prev => {
      const newTimers = new Map(prev);
      const timer = newTimers.get(timerId);
      if (timer && !timer.isPaused) {
        timer.isPaused = true;
        timer.pausedTime = Date.now();
      }
      return newTimers;
    });
    setSwipedTalent(null);
  };

  // タイマー再開
  const resumeTimer = (timerId: string) => {
    setActiveTimers(prev => {
      const newTimers = new Map(prev);
      const timer = newTimers.get(timerId);
      if (timer && timer.isPaused) {
        const pauseDuration = Date.now() - timer.pausedTime;
        timer.isPaused = false;
        timer.startTime = new Date(timer.startTime.getTime() + pauseDuration);
        timer.pausedTime = 0;
      }
      return newTimers;
    });
  };

  // タイマー停止
  const stopTimer = (timerId: string) => {
    const timer = activeTimers.get(timerId);
    if (!timer) return;
    
    let finalOvertimeSeconds = timer.overtimeSeconds;
    if (timer.remainingSeconds > 0) {
      finalOvertimeSeconds = -timer.remainingSeconds;
    }
    
    // タイマー毎に1つのレコードを作成
    const { groupName, talentName: actualTalentName } = parseTalentUniqueId(timer.talentName);
    
    const recordData: SessionData[] = [{
      dateTime: new Date().toISOString(),
      groupName: groupName,
      talentName: actualTalentName,
      buttonName: timer.buttons.map(btn => btn.config.buttonName).join(','),
      distributionCount: timer.buttons.reduce((sum, btn) => sum + btn.config.distributionCount, 0),
      seconds: timer.buttons.reduce((sum, btn) => sum + btn.config.seconds, 0),
      overtimeSeconds: finalOvertimeSeconds,
      status: '完了',
      staffName: userName
    }];
    
    setSessionData(prev => {
      const newData = [...prev, ...recordData];
      localStorage.setItem('timerSessionData', JSON.stringify(newData));
      return newData;
    });
    
    setAlerts(prev => prev.filter(alert => alert.talentName !== timer.talentName));
    
    // 次のタイマーがあれば自動開始
    const timerQueue = nextTimers.get(timer.talentName) || [];
    if (timerQueue.length > 0) {
      const nextTimer = timerQueue[0];
      const newTimerId = `${timer.talentName}_${Date.now()}`;
      const autoStartTimer: Timer = {
        id: newTimerId,
        talentName: timer.talentName,
        buttons: [...nextTimer.buttons],
        totalSeconds: nextTimer.totalSeconds,
        remainingSeconds: nextTimer.totalSeconds,
        totalTickets: nextTimer.totalTickets,
        isRunning: true,
        isPaused: false,
        pausedTime: 0,
        startTime: new Date(),
        isAlert: false,
        isOvertime: false,
        overtimeSeconds: 0,
        memberColor: nextTimer.memberColor
      };
      
      setActiveTimers(prev => new Map(prev.set(newTimerId, autoStartTimer)));
      
      const remainingQueue = timerQueue.slice(1);
      if (remainingQueue.length > 0) {
        setNextTimers(prev => new Map(prev.set(timer.talentName, remainingQueue)));
      } else {
        setNextTimers(prev => {
          const newMap = new Map(prev);
          newMap.delete(timer.talentName);
          return newMap;
        });
      }
    }
    
    setActiveTimers(prev => {
      const newMap = new Map(prev);
      newMap.delete(timerId);
      return newMap;
    });
  };

  // タイマーキャンセル
  const cancelTimer = (timerId: string) => {
    const timer = activeTimers.get(timerId);
    if (!timer) return;
    
    // タイマー毎に1つのレコードを作成（キャンセル時は配当枚数0）
    const { groupName, talentName: actualTalentName } = parseTalentUniqueId(timer.talentName);
    
    const recordData: SessionData[] = [{
      dateTime: new Date().toISOString(),
      groupName: groupName,
      talentName: actualTalentName,
      buttonName: timer.buttons.map(btn => btn.config.buttonName).join(','),
      distributionCount: 0, // キャンセル時は配当枚数0
      seconds: timer.buttons.reduce((sum, btn) => sum + btn.config.seconds, 0),
      overtimeSeconds: 0,
      status: 'キャンセル',
      staffName: userName
    }];
    
    setSessionData(prev => {
      const newData = [...prev, ...recordData];
      localStorage.setItem('timerSessionData', JSON.stringify(newData));
      return newData;
    });
    
    setAlerts(prev => prev.filter(alert => alert.talentName !== timer.talentName));
    setActiveTimers(prev => {
      const newMap = new Map(prev);
      newMap.delete(timerId);
      return newMap;
    });
    setSwipedTalent(null);
  };

  // タレントにフォーカス・スクロール
  const focusOnTalent = (talentUniqueId: string) => {
    const { groupName, talentName } = parseTalentUniqueId(talentUniqueId);
    console.log('focusOnTalent called for:', talentName);
    
    // 現在の画面状態を確認
    let isInCorrectState = false;
    let needsStateChange = false;
    
    if (currentScreen === 'talent') {
      if (selectedGroups.length > 0 || selectedIndividualTalents.length > 0) {
        // マルチ選択の場合：該当タレントが現在の選択に含まれているかチェック
        const isInSelectedGroups = selectedGroups.includes(groupName);
        const isInSelectedTalents = selectedIndividualTalents.includes(talentUniqueId);
        isInCorrectState = isInSelectedGroups || isInSelectedTalents;
        
        if (!isInCorrectState) {
          // 含まれていない場合、個別タレントとして追加
          console.log('Adding talent to current selection:', talentName);
          setSelectedIndividualTalents(prev => {
            if (!prev.includes(talentUniqueId)) {
              return [...prev, talentUniqueId];
            }
            return prev;
          });
          setMultiGroupTalentOrder([]);
          needsStateChange = true;
        }
      } else {
        // 単一グループ選択の場合
        isInCorrectState = selectedGroup === groupName;
        if (!isInCorrectState) {
          needsStateChange = true;
        }
      }
    } else {
      needsStateChange = true;
    }

    if (isInCorrectState && !needsStateChange) {
      // 既に正しい画面にいる場合はスクロールのみ
      setTimeout(() => scrollToTalent(talentUniqueId), 50);
    } else if (needsStateChange) {
      // 状態変更が必要な場合
      if (currentScreen !== 'talent') {
        // タレント画面以外からの場合、現在の選択状態を維持してタレント画面に移動
        showScreen('talent');
        setTimeout(() => scrollToTalent(talentUniqueId), 300);
      } else if (selectedGroups.length === 0 && selectedIndividualTalents.length === 0) {
        // 単一グループ表示で違うグループの場合のみ、グループを変更
        console.log('Setting new group for:', groupName);
        setSelectedGroup(groupName);
        setTimeout(() => scrollToTalent(talentUniqueId), 300);
      } else {
        // マルチ選択に追加済みの場合はスクロールのみ
        setTimeout(() => scrollToTalent(talentUniqueId), 100);
      }
    }
  };

  const scrollToTalent = (talentUniqueId: string) => {
    const { talentName } = parseTalentUniqueId(talentUniqueId);
    console.log('scrollToTalent called for:', talentName);
    
    // data-talent属性を持つ要素を検索
    const element = document.querySelector(`[data-talent="${talentUniqueId}"]`);
    if (element) {
      console.log('Element found, scrolling to:', talentName);
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // ハイライト効果
      const originalStyle = {
        transition: (element as HTMLElement).style.transition,
        boxShadow: (element as HTMLElement).style.boxShadow
      };
      
      (element as HTMLElement).style.transition = 'box-shadow 0.3s ease';
      (element as HTMLElement).style.boxShadow = '0 0 20px 4px rgba(59, 130, 246, 0.8)';
      
      setTimeout(() => {
        (element as HTMLElement).style.boxShadow = originalStyle.boxShadow;
        setTimeout(() => {
          (element as HTMLElement).style.transition = originalStyle.transition;
        }, 300);
      }, 2000);
    } else {
      console.log('Element not found for:', talentName, 'retrying...');
      setTimeout(() => {
        const retryElement = document.querySelector(`[data-talent="${talentUniqueId}"]`);
        console.log('Retry - element found:', !!retryElement);
        if (retryElement) {
          retryElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          // ハイライト効果
          const retryOriginalStyle = {
            transition: (retryElement as HTMLElement).style.transition,
            boxShadow: (retryElement as HTMLElement).style.boxShadow
          };
          
          (retryElement as HTMLElement).style.transition = 'box-shadow 0.3s ease';
          (retryElement as HTMLElement).style.boxShadow = '0 0 20px 4px rgba(59, 130, 246, 0.8)';
          
          setTimeout(() => {
            (retryElement as HTMLElement).style.boxShadow = retryOriginalStyle.boxShadow;
            setTimeout(() => {
              (retryElement as HTMLElement).style.transition = retryOriginalStyle.transition;
            }, 300);
          }, 2000);
        }
      }, 500);
    }
  };

  // 名前設定画面
  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">チェキタイマーPRO</h1>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              お名前を入力してください
            </label>
            <input
              ref={nameInputRef}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="名前を入力"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const name = nameInputRef.current?.value.trim();
                  if (name) {
                    setUserNameHandler(name);
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const name = nameInputRef.current?.value.trim();
                if (name) {
                  setUserNameHandler(name);
                }
              }}
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
            >
              設定
            </button>
          </div>
        </div>
      </div>
    );
  }

  // グループ画面の内容
  const renderGroupScreen = () => {
    const groups = [...new Set(buttonConfigs.map(config => config.groupName))];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6" />
            グループを選択
          </h2>
          {(selectedGroups.length > 0 || selectedIndividualTalents.length > 0) && (
            <button 
              onClick={resetSelections}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              リセット
            </button>
          )}
        </div>
        
        {/* 選択済み表示エリア */}
        {(selectedGroups.length > 0 || selectedIndividualTalents.length > 0) && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">選択済み</h3>
            
            {selectedGroups.length > 0 && (
              <div className="mb-3">
                <div className="text-sm text-blue-700 mb-1">グループ:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedGroups.map(group => (
                    <div key={group} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {group}
                      <button 
                        onClick={() => removeGroup(group)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedIndividualTalents.length > 0 && (
              <div className="mb-3">
                <div className="text-sm text-blue-700 mb-1">個別タレント:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedIndividualTalents.map(talentUniqueId => {
                    const { groupName, talentName } = parseTalentUniqueId(talentUniqueId);
                    return (
                      <div key={talentUniqueId} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {talentName}
                        <span className="text-xs text-green-600">({groupName})</span>
                        <button 
                          onClick={() => removeIndividualTalent(talentUniqueId)}
                          className="text-green-600 hover:text-green-800 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <button 
              onClick={showMultiGroupTalents}
              className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
            >
              選択したタレント一覧を表示
            </button>
          </div>
        )}
        
        {/* グループ一覧 */}
        <div className="grid gap-3">
          {groups.map(group => {
            const groupTalents = [...new Set(
              buttonConfigs
                .filter(config => config.groupName === group)
                .map(config => getTalentUniqueId(config.groupName, config.talentName))
            )];
            const isExpanded = expandedGroups.has(group);
            
            return (
              <div key={group} className="bg-white rounded-lg shadow">
                <div className="flex gap-2 p-3">
                  <button 
                    onClick={() => selectGroupHandler(group)}
                    className="flex-1 text-left"
                  >
                    <div className="font-semibold">{group}</div>
                    <div className="text-sm text-gray-500">{groupTalents.length}人</div>
                  </button>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => toggleGroupExpansion(group)}
                      className="bg-gray-400 text-white px-2 py-1 rounded text-sm hover:bg-gray-500"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                    <button 
                      onClick={() => addGroup(group)}
                      disabled={selectedGroups.includes(group)}
                      className={`${selectedGroups.includes(group) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'} px-2 py-1 rounded text-sm font-medium`}
                    >
                      {selectedGroups.includes(group) ? '追加済み' : 'グループ追加'}
                    </button>
                  </div>
                </div>
                
                {/* グループ展開時のタレント一覧 */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-3">
                    <div className="grid gap-2">
                      {groupTalents.map(talentUniqueId => {
                        const { talentName } = parseTalentUniqueId(talentUniqueId);
                        const isGroupSelected = selectedGroups.includes(group);
                        const isTalentSelected = selectedIndividualTalents.includes(talentUniqueId);
                        const isDisabled = isGroupSelected || isTalentSelected;
                        
                        return (
                          <div key={talentUniqueId} className="flex justify-between items-center text-sm">
                            <span className="flex-1">{talentName}</span>
                            <button 
                              onClick={() => addIndividualTalent(talentUniqueId)}
                              disabled={isDisabled}
                              className={`${isDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} px-2 py-1 rounded text-xs`}
                            >
                              {isGroupSelected ? 'グループ選択済み' : isTalentSelected ? '追加済み' : '追加'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // タレント画面の内容
  const renderTalentScreen = () => {
    // マルチ選択がある場合はそれを優先、なければ単一グループのタレント
    const talents = (selectedGroups.length > 0 || selectedIndividualTalents.length > 0) 
      ? getAllTalentsFromSelectedGroups()
      : (talentOrders[selectedGroup] || 
          [...new Set(buttonConfigs.filter(config => config.groupName === selectedGroup).map(config => getTalentUniqueId(config.groupName, config.talentName)))]
        ).filter(talentUniqueId => !hiddenTalents.has(talentUniqueId));
    
    const isMultiSelection = selectedGroups.length > 0 || selectedIndividualTalents.length > 0;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="w-6 h-6" />
            {isMultiSelection 
              ? `選択済み (グループ:${selectedGroups.length} タレント:${selectedIndividualTalents.length})` 
              : `${selectedGroup} - タレント一覧`}
          </h2>
          <button 
            onClick={() => showScreen('group')}
            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm"
          >
            戻る
          </button>
        </div>
        
        <div className="grid gap-3">
          {talents.map((talentUniqueId, index) => {
            const { groupName, talentName } = parseTalentUniqueId(talentUniqueId);
            const activeTimer = Array.from(activeTimers.values()).find(timer => timer.talentName === talentUniqueId);
            const nextTimer = nextTimers.get(talentUniqueId) || [];
            const memberColor = buttonConfigs.find(config => 
              config.groupName === groupName && config.talentName === talentName)?.memberColor || '#6b7280';
            
            return (
              <div key={talentUniqueId} className="relative" data-talent={talentUniqueId}>
                <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow flex overflow-hidden cursor-pointer" 
                     onClick={() => !swipedTalent && selectTalentHandler(talentUniqueId)}>
                  
                  {/* カラーバー（操作エリア） */}
                  <div 
                    style={{ backgroundColor: memberColor, width: '48px', minHeight: '120px' }}
                    className="flex flex-col items-center justify-center relative cursor-pointer select-none"
                    draggable={dragState.isLongPress}
                    onDragStart={(e) => handleDragStart(e, talentUniqueId, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onMouseDown={() => handleLongPressStart(talentUniqueId, index)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(talentUniqueId, index)}
                    onTouchEnd={handleLongPressEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!dragState.isLongPress) {
                        toggleTalentMenu(talentUniqueId);
                      }
                    }}
                  >
                    <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', opacity: 0.9 }}>
                      ⋮
                    </div>
                    {activeTimer && (
                      <div className="absolute bottom-2 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* タレント情報 */}
                  <div className="flex-1 p-3">
                    <div className="font-semibold flex items-center gap-2">
                      {talentName}
                      {isMultiSelection && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {groupName}
                        </span>
                      )}
                      {activeTimer && activeTimer.isPaused && (
                        <span className="text-sm bg-yellow-500 text-white px-2 py-1 rounded">一時停止中</span>
                      )}
                    </div>
                    {activeTimer && (
                      <div className="text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4" />
                          残り: {formatTime(activeTimer.remainingSeconds)}
                          {activeTimer.isOvertime && (
                            <span className="text-red-600 font-bold">超過: +{activeTimer.overtimeSeconds}秒</span>
                          )}
                          <span className="ml-2">🎫: {activeTimer.totalTickets}枚</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          内容: {activeTimer.buttons.map(btn => btn.config.buttonName).join(', ')}
                        </div>
                      </div>
                    )}
                    {nextTimer && nextTimer.length > 0 && (
                      <div className="text-sm text-blue-600 mt-2">
                        {nextTimer.map((timer, index) => (
                          <div key={index} className="mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{index + 1}タイマー: {formatTime(timer.totalSeconds)}</span>
                            </div>
                            <div className="text-xs text-gray-500 ml-6">🎫: {timer.totalTickets}枚</div>
                            <div className="text-xs text-gray-500 ml-6">内容: {timer.buttons.map((btn: any) => `${btn.config.buttonName}×${btn.count || 1}`).join(', ')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-2 p-3 flex-shrink-0 items-start" onClick={(e) => e.stopPropagation()}>
                    {activeTimer && (
                      <>
                        {activeTimer.isPaused ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              resumeTimer(activeTimer.id);
                            }}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                          >
                            再開
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (oneClickFinish) {
                                stopTimer(activeTimer.id);
                              } else {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: '終了確認',
                                  message: '本当にタイマーを終了しますか？',
                                  callback: (confirmed) => {
                                    if (confirmed) {
                                      stopTimer(activeTimer.id);
                                    }
                                  }
                                });
                              }
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                          >
                            終了
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 操作メニュー */}
                {swipedTalent === talentUniqueId && (
                  <div className="absolute inset-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col justify-between z-10">
                    <div className="flex justify-between items-start">
                      <button 
                        onClick={() => setSwipedTalent(null)}
                        className="text-gray-500 hover:text-gray-700 text-lg font-bold flex-shrink-0"
                      >
                        ✕
                      </button>
                      <div className="text-center font-semibold text-gray-700 flex-1 mx-2">
                        {talentName}
                      </div>
                      <div className="w-6"></div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-end gap-2">
                        {activeTimer ? (
                          <>
                            {!activeTimer.isPaused && (
                              <button 
                                onClick={() => pauseTimer(activeTimer.id)}
                                className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 text-sm"
                              >
                                一時停止
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'キャンセル確認',
                                  message: '本当にタイマーをキャンセルしますか？',
                                  callback: (confirmed) => {
                                    if (confirmed) {
                                      cancelTimer(activeTimer.id);
                                    }
                                  }
                                });
                              }}
                              className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm"
                            >
                              キャンセル
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => hideTalent(talentUniqueId)}
                            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm"
                          >
                            非表示
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // タイマー画面の内容
  const renderTimerScreen = () => {
    const { groupName, talentName } = parseTalentUniqueId(selectedTalent);
    const activeTimer = Array.from(activeTimers.values()).find(timer => timer.talentName === selectedTalent);
    const timerQueue = nextTimers.get(selectedTalent) || [];
    
    const talentButtons = buttonConfigs.filter(config => 
      config.groupName === groupName && config.talentName === talentName
    );
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{talentName} ({groupName}) - ボタン選択</h2>
          <button 
            onClick={() => showScreen('talent')}
            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm"
          >
            戻る
          </button>
        </div>
        
        {activeTimer && (
          <div className="bg-yellow-100 border border-yellow-400 p-3 rounded-lg">
            <div className="font-semibold text-yellow-800">
              🕐 現在タイマー動作中: 残り {formatTime(activeTimer.remainingSeconds)}
            </div>
            {timerQueue.length > 0 && (
              <div className="text-sm text-yellow-700 mt-2">
                📋 設定済みタイマー:
                {timerQueue.map((timer, index) => (
                  <div key={index} className="ml-4 mt-2">
                    <div className="font-medium">{index + 1}タイマー: {formatTime(timer.totalSeconds)}</div>
                    <div className="text-xs ml-2">🎫: {timer.totalTickets}枚</div>
                    <div className="text-xs ml-2">内容: {timer.buttons.map((btn: any) => btn.config.buttonName).join(', ')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className={`grid gap-3 ${buttonLayoutTwoColumns ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {talentButtons.map(button => {
            const selectedCount = selectedButtons.filter(item => item.config.buttonName === button.buttonName).length;
            const textColor = getContrastTextColor(button.buttonColor);
            
            return (
              <button
                key={button.buttonName}
                onClick={() => toggleButton(button.buttonName)}
                className="p-3 rounded-lg font-semibold hover:opacity-80 transition-opacity text-center"
                style={{ backgroundColor: button.buttonColor, color: textColor }}
              >
                {buttonLayoutTwoColumns ? (
                  <>
                    <div className="text-base font-bold mb-1">{button.buttonName}</div>
                    <div className="text-xs opacity-90">
                      {button.seconds}秒 / 🎫{button.ticketCount}枚
                      {selectedCount > 0 && (
                        <><br /><span className="font-semibold">選択済み: {selectedCount}個</span></>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span>{button.buttonName}</span>
                    <div className="text-sm">
                      {button.seconds}秒 / 🎫{button.ticketCount}枚
                      {selectedCount > 0 && (
                        <span className="ml-2">選択済み: {selectedCount}個</span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedButtons.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            {/* 合計情報とスタートボタン */}
            <div className="border-b pb-3 mb-3">
              <div className="font-semibold text-lg mb-2">
                合計: {selectedButtons.reduce((sum, item) => sum + item.config.seconds, 0)}秒 / 🎫{selectedButtons.reduce((sum, item) => sum + item.config.ticketCount, 0)}枚 ({selectedButtons.length}個のボタン)
              </div>

              <button 
                onClick={startTimer}
                className={`w-full py-3 rounded flex items-center justify-center gap-2 text-white font-semibold ${
                  activeTimer ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                <Play className="w-5 h-5" />
                {activeTimer ? `${timerQueue.length + 1}タイマー設定` : 'スタート'}
              </button>
            </div>

            {/* 選択済み詳細リスト */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">選択済み</h3>
              <button 
                onClick={() => setSelectedButtons([])}
                className="bg-red-400 text-white px-3 py-1 rounded text-xs hover:bg-red-500"
              >
                すべて削除
              </button>
            </div>
            <div className="space-y-2">
              {selectedButtons.map((item, index) => (
                <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{item.config.buttonName}</span>
                    <div className="text-xs text-gray-500">
                      {item.config.seconds}秒 / 🎫{item.config.ticketCount}枚
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedButtons(prev => prev.filter(btn => btn.id !== item.id))}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 ml-2"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 送信データ画面の内容
  const renderSendDataScreen = () => {
    const totalOvertimeSeconds = sessionData.reduce((sum, d) => sum + d.overtimeSeconds, 0);
    const overtimeText = totalOvertimeSeconds === 0 ? '0秒' : 
                        totalOvertimeSeconds > 0 ? `+${totalOvertimeSeconds}秒（超過）` : 
                        `${totalOvertimeSeconds}秒（早期終了）`;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">送信データ確認</h2>
          <button 
            onClick={() => showScreen('group')}
            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm"
          >
            戻る
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">削除</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">グループ名</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タレント名</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ボタン名</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配当枚数</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">秒数</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">超過秒数</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状況</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">担当スタッフ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessionData.map((data, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 sticky left-0" style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <button 
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: '削除確認',
                            message: '以下のデータを削除しますか？',
                            details: `日時: ${new Date(data.dateTime).toLocaleString('ja-JP')}\nグループ: ${data.groupName}\nタレント: ${data.talentName}\nボタン: ${data.buttonName}`,
                            callback: (confirmed) => {
                              if (confirmed) {
                                const newData = sessionData.filter((_, i) => i !== index);
                                setSessionData(newData);
                                localStorage.setItem('timerSessionData', JSON.stringify(newData));
                              }
                            }
                          });
                        }}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        削除
                      </button>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900">{new Date(data.dateTime).toLocaleString('ja-JP')}</td>
                    <td className="px-2 py-2 text-xs text-gray-900">{data.groupName}</td>
                    <td className="px-2 py-2 text-xs text-gray-900">{data.talentName}</td>
                    <td className="px-2 py-2 text-xs text-gray-900">{data.buttonName}</td>
                    <td className="px-2 py-2 text-xs text-gray-900">{data.distributionCount}</td>
                    <td className="px-2 py-2 text-xs text-gray-900">{data.seconds}</td>
                    <td className="px-2 py-2 text-xs text-gray-900">
                      {data.overtimeSeconds === 0 ? '0秒' : 
                        data.overtimeSeconds > 0 ? `+${data.overtimeSeconds}秒` : 
                        `${data.overtimeSeconds}秒`}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900">
                      <span className={`px-2 py-1 rounded text-xs ${data.status === 'キャンセル' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {data.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900">{data.staffName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">送信内容サマリー</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div>総レコード数: {sessionData.length}件</div>
            <div>対象グループ: {[...new Set(sessionData.map(d => d.groupName))].join(', ')}</div>
            <div>総🎫枚数: {sessionData.reduce((sum, d) => sum + d.distributionCount, 0)}枚</div>
            <div>総実行時間: {Math.floor(sessionData.reduce((sum, d) => sum + d.seconds, 0) / 60)}分{sessionData.reduce((sum, d) => sum + d.seconds, 0) % 60}秒</div>
            <div>時間調整: {overtimeText}</div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => {
              if (sessionData.length === 0) {
                alert('送信するデータがありません。');
                return;
              }
              
              const totalRecords = sessionData.length;
              const totalTickets = sessionData.reduce((sum, d) => sum + d.distributionCount, 0);
              
              setConfirmDialog({
                isOpen: true,
                title: 'データ送信確認',
                message: `スプレッドシートにデータを送信します。\n\n📊 送信内容:\n・レコード数: ${totalRecords}件\n・総配当枚数: ${totalTickets}枚\n・送信先: dataシート`,
                details: '⚠️ 重要: 送信完了後、端末内のデータがリセットされます。\n\n送信後は以下のデータが削除されます:\n・セッション履歴\n・送信待ちデータ\n\nデータを送信してもよろしいですか？',
                callback: (confirmed) => {
                  if (confirmed) {
                    // 送信処理（実際の実装では非同期処理）
                    alert('送信機能は実装中です。');
                  }
                }
              });
            }}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-semibold"
          >
            データを送信する
          </button>
          <button 
            onClick={() => showScreen('group')}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-semibold"
          >
            キャンセル
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">担当スタッフ</h3>
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700">{userName}</span>
            <button 
              onClick={() => setIsEditingStaffName(true)}
              className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-sm"
            >
              スタッフ名を修正
            </button>
          </div>
          {isEditingStaffName && (
            <div className="mt-3 space-y-3">
              <input 
                type="text" 
                defaultValue={userName}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="スタッフ名を入力" 
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const newName = (e.target as HTMLInputElement).value.trim();
                    if (newName) {
                      setUserName(newName);
                      localStorage.setItem('timerUserName', newName);
                      setIsEditingStaffName(false);
                    }
                  }
                }}
              />
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                    const newName = input?.value.trim();
                    if (newName) {
                      setUserName(newName);
                      localStorage.setItem('timerUserName', newName);
                      setIsEditingStaffName(false);
                    }
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                >
                  保存
                </button>
                <button 
                  onClick={() => setIsEditingStaffName(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white p-4 relative">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">チェキタイマーPRO</h1>
            <div className="text-xs text-blue-200 mt-1">Produced by XiDEA</div>
          </div>
          
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="bg-blue-700 hover:bg-blue-800 p-2 rounded transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        {/* アラート表示 */}
        {alerts.map(alert => {
          const { talentName } = parseTalentUniqueId(alert.talentName);
          return (
            <div
              key={alert.id}
              onClick={() => focusOnTalent(alert.talentName)}
              className={`mt-2 p-3 rounded text-center font-bold cursor-pointer hover:opacity-90 transition-all duration-200 select-none ${
                alert.type === 'overtime' ? 'animate-pulse' : 'animate-bounce'
              }`}
              style={{ backgroundColor: alert.memberColor, color: 'white' }}
            >
              {talentName} - {alert.message}
              {alert.overtime && ` (+${alert.overtime}秒)`}
            </div>
          );
        })}
        
        {/* タイマーバー */}
        {activeTimers.size > 0 && (
          <div className="mt-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-2">
            <div className="text-xs text-blue-100 mb-2 font-medium">動作中タイマー</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(activeTimers.values())
                .sort((a, b) => {
                  // 残り時間が少ない順（タイマーが切れそうな順）にソート
                  // 超過時間も考慮：超過している場合は超過時間が多い順
                  if (a.isOvertime && b.isOvertime) {
                    return b.overtimeSeconds - a.overtimeSeconds; // 超過時間が多い順
                  } else if (a.isOvertime && !b.isOvertime) {
                    return -1; // 超過しているものを優先
                  } else if (!a.isOvertime && b.isOvertime) {
                    return 1; // 超過しているものを優先
                  } else {
                    return a.remainingSeconds - b.remainingSeconds; // 残り時間が少ない順
                  }
                })
                .map(timer => {
                const { talentName, groupName } = parseTalentUniqueId(timer.talentName);
                const progress = timer.isOvertime 
                  ? 100 
                  : ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100;
                const textColor = getContrastTextColor(timer.memberColor);
                
                return (
                  <div
                    key={timer.id}
                    onClick={() => {
                      // 終了ボタンと同じ挙動
                      if (oneClickFinish) {
                        stopTimer(timer.id);
                      } else {
                        setConfirmDialog({
                          isOpen: true,
                          title: '終了確認',
                          message: `${talentName}のタイマーを終了しますか？`,
                          callback: (confirmed) => {
                            if (confirmed) {
                              stopTimer(timer.id);
                            }
                          }
                        });
                      }
                    }}
                    className="rounded px-2 py-1 cursor-pointer hover:opacity-90 transition-all duration-200 min-w-0 flex-shrink-0"
                    style={{ 
                      maxWidth: '120px',
                      backgroundColor: timer.memberColor,
                      color: textColor
                    }}
                  >
                    <div className="text-xs font-medium truncate" title={`${talentName} (${groupName})`}>
                      {talentName}
                    </div>
                    <div className="opacity-60 truncate" title={groupName} style={{ fontSize: '10px' }}>
                      {groupName}
                    </div>
                    <div className="mt-1 h-2 bg-black bg-opacity-20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          timer.isOvertime 
                            ? 'animate-pulse' 
                            : ''
                        }`}
                        style={{ 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: timer.isOvertime 
                            ? '#ef4444' 
                            : timer.isAlert 
                              ? '#eab308' 
                              : textColor === '#000000' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'
                        }}
                      />
                    </div>
                    <div className="text-xs mt-1 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span>{formatTime(timer.remainingSeconds)}</span>
                        {timer.isOvertime && (
                          <span className="font-bold" style={{ fontSize: '9px' }}>
                            +{timer.overtimeSeconds}秒
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {timer.isPaused && <span className="font-bold">⏸</span>}
                        {timer.isOvertime && <span className="font-bold">!</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* メインコンテンツ */}
      <main className="p-4">
        {currentScreen === 'group' && renderGroupScreen()}
        {currentScreen === 'talent' && renderTalentScreen()}
        {currentScreen === 'timer' && renderTimerScreen()}
        {currentScreen === 'sendData' && renderSendDataScreen()}
      </main>

      {/* スライドメニュー */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">メニュー</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4 flex-1">
                <button 
                  onClick={() => {
                    loadButtonConfig();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">設定更新</span>
                </button>
                
                <button 
                  onClick={() => {
                    alert('スプレッドシート接続テスト機能は実装中です。');
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <Link className="w-5 h-5" />
                  <span className="font-medium">スプレッドシート接続テスト</span>
                </button>
                
                <button 
                  onClick={() => {
                    showScreen('sendData');
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span className="font-medium">情報送信</span>
                </button>
                
                {hiddenTalents.size > 0 && (
                  <button 
                    onClick={() => {
                      setHiddenTalents(new Set());
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">すべて表示</span>
                  </button>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    設定
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-3">
                        <div className="font-medium text-gray-700 text-sm">終了をワンタップ</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {oneClickFinish ? 'ワンタップで終了' : '確認後に終了'}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newValue = !oneClickFinish;
                          setOneClickFinish(newValue);
                          localStorage.setItem('timerOneClickFinish', JSON.stringify(newValue));
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          oneClickFinish ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          oneClickFinish ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-3">
                        <div className="font-medium text-gray-700 text-sm">ボタン2列表示</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {buttonLayoutTwoColumns ? '2列表示' : '1列表示'}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newValue = !buttonLayoutTwoColumns;
                          setButtonLayoutTwoColumns(newValue);
                          localStorage.setItem('timerButtonLayoutTwoColumns', JSON.stringify(newValue));
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          buttonLayoutTwoColumns ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          buttonLayoutTwoColumns ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 確認ダイアログ */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{confirmDialog.title}</h3>
            <p className="text-gray-600 mb-4 whitespace-pre-line">{confirmDialog.message}</p>
            {confirmDialog.details && (
              <div className="bg-gray-50 p-3 rounded mb-4 text-sm whitespace-pre-line">
                {confirmDialog.details}
              </div>
            )}
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (confirmDialog.callback) {
                    confirmDialog.callback(true);
                  }
                  setConfirmDialog({ isOpen: false, title: '', message: '' });
                }}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                はい
              </button>
              <button 
                onClick={() => {
                  if (confirmDialog.callback) {
                    confirmDialog.callback(false);
                  }
                  setConfirmDialog({ isOpen: false, title: '', message: '' });
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOPボタン（フローティング） */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group"
        style={{ touchAction: 'manipulation' }}
        title="ページトップに戻る"
      >
        <ChevronUp className="w-6 h-6 group-hover:animate-bounce" />
      </button>
    </div>
  );
};

export default ChekiTimerPro;