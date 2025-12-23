
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Loader2, MessageSquareText, ShieldAlert, Rocket, TrendingUp, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Asset, Liability, IncomeExpense, StressTestState } from '../types';

interface AIDiagnosisProps {
  assets: Asset[];
  liabilities: Liability[];
  incomeExpense: IncomeExpense;
  stress: StressTestState;
  financialData: any;
  onResetKey: () => Promise<void>;
}

const AIDiagnosis: React.FC<AIDiagnosisProps> = ({ assets, liabilities, incomeExpense, stress, financialData, onResetKey }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const generateDiagnosis = async () => {
    setErrorDetail(null);
    
    // 檢查 API KEY 是否存在且不是字串 "undefined"
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      setReport("尚未偵測到 API_KEY。");
      setErrorDetail("請在 Vercel 後台 Settings > Environment Variables 新增 API_KEY，並務必重新部署 (Redeploy)。");
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const prompt = `
        你是一位頂級財富管理專家，擅長「以配息支撐槓桿、以槓桿創造資產」的戰略。
        請根據以下數據進行「財務健康度與風險診斷」：

        [基本數據]
        - 真實淨資產: ${financialData.netWorth}
        - 每月總收入: ${financialData.monthlyTotalIncomeActive + financialData.monthlyPassiveIncome} (主動: ${financialData.monthlyTotalIncomeActive}, 被動: ${financialData.monthlyPassiveIncome})
        - 每月總支出(含利息): ${financialData.monthlyTotalExpense}
        - 每月戰略盈餘: ${financialData.netCashFlow}
        - 總流動性備用金: ${financialData.totalLiquidity}

        [資產負債細節]
        - 投資資產總額: ${assets.filter(a => a.type === 'investment').reduce((sum, a) => sum + a.marketValue, 0)}
        - 總負債: ${liabilities.reduce((sum, l) => sum + l.principal, 0)}
        - 質押/保單借款總額: ${liabilities.filter(l => l.type === 'policy' || l.type === 'pledge').reduce((sum, l) => sum + l.principal, 0)}

        [當前壓力測試環境]
        - 股災模擬: -${stress.marketCrash * 100}%
        - 升息模擬: +${stress.interestHike * 100}%

        請用專業、簡潔且具備戰略眼長的語氣給予建議。內容需包含：
        1. 現況診斷 (目前的槓桿效力與安全性)
        2. 風險預警 (針對當前壓力測試下的維持率或現金流提出警告)
        3. 戰略行動 (給予 2-3 個具體的優化方向)
        請使用繁體中文，格式請多用列表，避免冗長段落。
      `;

      // 使用 gemini-3-flash-preview 作為預設穩定模型
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setReport(response.text || "報告內容為空，請稍後重試。");
    } catch (error: any) {
      console.error("Gemini API Full Error:", error);
      const msg = error.message || String(error);
      
      setReport("AI 診斷失敗");
      
      if (msg.includes("API_KEY_INVALID") || msg.includes("403") || msg.includes("401")) {
        setErrorDetail("API Key 無效或權限遭拒。請確認金鑰字串正確（開頭通常為 AIza...），且沒有包含多餘的引號或空白。");
      } else if (msg.includes("model not found") || msg.includes("404")) {
        setErrorDetail("找不到指定模型。這可能是因為您的金鑰所在區域尚不支援此模型。");
      } else {
        setErrorDetail(`具體錯誤：${msg.slice(0, 100)}`);
      }

      if (window.aistudio) {
        onResetKey();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-orange-100 shadow-xl overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-50/0 via-rose-50/30 to-rose-50/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-xl shadow-lg shadow-rose-200">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">AI 戰略指揮官</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Gemini 3</p>
            </div>
          </div>
          
          <button 
            onClick={generateDiagnosis}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-rose-100"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {report ? '重新診斷' : '生成戰略報告'}
          </button>
        </div>

        {errorDetail && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-start animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-rose-600 mb-1">診斷發生問題</p>
              <p className="text-[11px] font-bold text-rose-500 leading-relaxed">{errorDetail}</p>
            </div>
          </div>
        )}

        {!report && !loading && !errorDetail && (
          <div className="py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 rounded-full mb-4">
              <MessageSquareText className="w-8 h-8 text-rose-300" />
            </div>
            <p className="text-sm font-bold text-slate-400 max-w-[200px] mx-auto leading-relaxed">
              點擊上方按鈕，AI 將根據您的數據進行深度戰略分析。
            </p>
          </div>
        )}

        {loading && (
          <div className="py-12 flex flex-col items-center justify-center animate-pulse">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">正在分析財務流向與風險水位...</p>
          </div>
        )}

        {report && !loading && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-5 text-slate-700">
              <div className="prose prose-sm max-w-none text-xs leading-relaxed font-bold">
                {report.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('#') ? 'text-sm font-black text-rose-600 mt-4 mb-2' : 'mb-1'}>
                    {line.replace(/[#*]/g, '')}
                  </p>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex flex-col items-center text-center">
                <Rocket className="w-3.5 h-3.5 text-emerald-500 mb-1" />
                <span className="text-[9px] font-black text-emerald-600">優化效率</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex flex-col items-center text-center">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 mb-1" />
                <span className="text-[9px] font-black text-amber-600">風險覆蓋</span>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex flex-col items-center text-center">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500 mb-1" />
                <span className="text-[9px] font-black text-indigo-600">配置調整</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDiagnosis;
