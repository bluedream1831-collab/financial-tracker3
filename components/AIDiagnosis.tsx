
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Loader2, MessageSquareText, ShieldAlert, Rocket, TrendingUp } from 'lucide-react';
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

  const generateDiagnosis = async () => {
    // 檢查 API KEY 是否存在
    if (!process.env.API_KEY || process.env.API_KEY === 'undefined') {
      setReport("尚未偵測到環境變數 API_KEY。請在 Vercel Settings -> Environment Variables 設定後重新部署。");
      return;
    }

    setLoading(true);
    try {
      // 根據規範，每次呼叫前實例化
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
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

      // 使用 gemini-flash-latest 以獲得最佳相容性
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });

      setReport(response.text || "報告生成為空，請稍後重試。");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const errorMsg = error.message || "";
      
      if (errorMsg.includes("403") || errorMsg.includes("permission") || errorMsg.includes("API_KEY_INVALID")) {
        setReport("API 金鑰權限不足或無效。請確認 Vercel 的 API_KEY 是否正確（無引號、無空格），並確認該金鑰已在 Google AI Studio 啟用。");
      } else if (errorMsg.includes("404") || errorMsg.includes("not found")) {
        setReport("找不到 AI 模型或金鑰設定有誤。請檢查 Vercel 設定並點擊 Redeploy。");
      } else {
        setReport(`連線失敗: ${errorMsg.slice(0, 50)}... 請檢查網路或 API 額度。`);
      }

      // 如果支援 aistudio 工具，則調用重置
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Gemini Flash</p>
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

        {!report && !loading && (
          <div className="py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 rounded-full mb-4">
              <MessageSquareText className="w-8 h-8 text-rose-300" />
            </div>
            <p className="text-sm font-bold text-slate-400 max-w-[200px] mx-auto leading-relaxed">
              點擊上方按鈕，AI 將進行深度戰略分析。
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
