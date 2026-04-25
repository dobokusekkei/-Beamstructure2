import React from 'react';
import { History, X } from 'lucide-react';

export function VersionHistoryModal({ onClose }: { onClose: () => void }) {
    const history = [
        { ver: "v30.00", date: "2026/04/25", desc: "React版への完全移行。分布荷重の両端矢印表示。応力表示のON/OFF切替機能を追加。RC単鉄筋長方形断面の鉄筋・コンクリート応力度、せん断応力度計算機能を追加。" },
        { ver: "v21.60", date: "2026/02/12", desc: "スパン毎のEI違いによる節点モーメント計算の不具合を修正（荷重項のEI割当てバグを解消）。支点におけるたわみ初期条件を修正（固定端のたわみ角ゼロを厳密化）。" },
        { ver: "v21.50", date: "2026/02/12", desc: "スパンごとのEI違いによるたわみ曲線の計算不具合を修正。各スパン独立の数値積分と境界条件の伝播による精密計算ロジックに変更。" },
        { ver: "v21.40", date: "2026/02/12", desc: "材料・断面設定をスパンごとに変更できるよう対応。計算エンジンをスパンごとの剛性（EI）を考慮するよう改修。" },
        { ver: "v21.30", date: "2026/02/08", desc: "別ウィンドウで結果を表示可能にした。" },
        { ver: "v21.29", date: "2026/02/08", desc: "CSV出力を印刷レポート準拠の詳細形式に改修（スパンごとの最大最小、ローカル座標での詳細結果）。CSV読込時のインプットデータ復元処理を強化。" },
        { ver: "v21.28", date: "2026/02/08", desc: "CSV出力機能を強化。結果詳細（全着目点）を出力し、材料入力データは選択中のタイプのみ出力するように変更。" },
        { ver: "v21.27", date: "2026/02/08", desc: "入力データ保存機能を廃止し、結果CSV出力機能（入力データ含む）を実装。CSV読込による入力データ復元機能を追加。" },
        { ver: "v21.26", date: "2026/02/08", desc: "荷重表等の支点表示において、各スパンごとの値を厳密に分離して表示するように修正。" },
        { ver: "v21.25", date: "2026/02/08", desc: "ラベル配置ロジックからX方向移動（左右振り分け）を廃止。" },
        { ver: "v21.24", date: "2026/02/08", desc: "ラベル配置ロジックの定数を最終調整。左右振り分け処理を追加。" },
        { ver: "v21.23", date: "2026/02/08", desc: "ラベル配置をグラフ線へ接近(10-12px)させ、衝突判定を厳密化(14px)。" },
        { ver: "v21.22", date: "2026/02/08", desc: "ラベル重なり回避ロジックを刷新（方向自動判定＋厳密重複回避）。" },
        { ver: "v21.21", date: "2026/02/08", desc: "ラベル重なり回避ロジックを「X座標順次確定（貪欲法）」に刷新。" },
        { ver: "v21.20", date: "2026/02/08", desc: "ラベル重なり回避ロジックを「事前計算方式」に刷新。" },
        { ver: "v21.19", date: "2026/02/08", desc: "グラフ描画レイアウト調整（全体シフト）、ラベル重なり回避ロジックの強化。" },
        { ver: "v21.18", date: "2026/02/08", desc: "固定端(Fixed)に作用する集中モーメント荷重を計算対象から除外(スキップ)する処理を追加。" },
        { ver: "v21.17", date: "2026/02/05", desc: "右端単純支持における集中モーメント荷重の計算結果表示を補正。バージョン履歴機能を追加。" },
        { ver: "v21.16", date: "2026/02/04", desc: "着目点入力の改善(PoiInput)、グラフ描画の重複回避(レイアウト拡大)、不連続点処理の強化。" },
        { ver: "v21.15", date: "2026/01/29", desc: "任意断面入力モードの実装、モーメント荷重への対応、断面プロファイル表示の拡充。" },
        { ver: "v21.00", date: "2025/12/01", desc: "UIデザインの刷新、印刷レポート機能の強化、保存/読込機能の実装。" }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        <History className="w-5 h-5 text-blue-600" />
                        更新履歴
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="p-0 overflow-y-auto max-h-[60vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-500 font-medium">
                            <tr>
                                <th className="p-3 border-b">Version</th>
                                <th className="p-3 border-b">Date</th>
                                <th className="p-3 border-b">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {history.map((h, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-blue-600 align-top">{h.ver}</td>
                                    <td className="p-3 text-slate-500 text-xs align-top whitespace-nowrap">{h.date}</td>
                                    <td className="p-3 text-slate-700 align-top">{h.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t bg-slate-50 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">閉じる</button>
                </div>
            </div>
        </div>
    );
}
