import React from 'react';
import { HelpCircle, X } from 'lucide-react';

export function HelpModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        <HelpCircle className="w-5 h-5 text-blue-600" />
                        ユーザーマニュアル
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto text-sm text-slate-700 leading-relaxed space-y-6">
                    <section>
                        <h3 className="font-bold text-slate-900 border-l-4 border-blue-500 pl-2 mb-2">1. はじめに</h3>
                        <p>本アプリケーションは、単純梁や連続梁などの構造計算（断面力・たわみ）をブラウザ上で手軽に行えるツールです。鋼材やRC断面のデータベースを内蔵し、即座に計算結果をグラフで可視化します。</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-900 border-l-4 border-blue-500 pl-2 mb-2">2. 基本操作</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>断面設定:</strong> 左側のパネルで「対象スパン」を選択後、「S造」「RC造」「任意」から選択し、形状や寸法を指定します。すべてのスパンに同じ設定を適用することも可能です。</li>
                            <div className="mt-2 p-3 bg-slate-50 border rounded text-xs text-slate-600">
                                <strong>RC断面の算出式（矩形）:</strong><br/>
                                幅 <span className="math-inline">b</span>, 高さ <span className="math-inline">D</span> の場合
                                <div className="math-display text-base py-2">
                                    <span className="math-inline">I</span> <span className="op">=</span>
                                    <div className="fraction">
                                        <span><span className="math-inline">b</span><span className="math-inline">D</span><span className="sup">3</span></span>
                                        <span>12</span>
                                    </div>
                                    <span className="op">,</span>
                                    &nbsp;&nbsp;
                                    <span className="math-inline">Z</span> <span className="op">=</span>
                                    <div className="fraction">
                                        <span><span className="math-inline">b</span><span className="math-inline">D</span><span className="sup">2</span></span>
                                        <span>6</span>
                                    </div>
                                </div>
                            </div>
                            <li><strong>モデル設定:</strong> 梁タイプ（単純梁、連続梁など）を選択し、スパン長を入力します。複数スパンはカンマ区切り（例: <code>5.0, 5.0</code>）で入力可能です。</li>
                            <li><strong>荷重入力:</strong> 「集中」「等分布」「台形」「モーメント」から種類を選び、大きさ・位置を入力して「追加」ボタンを押します。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-900 border-l-4 border-blue-500 pl-2 mb-2">3. 荷重の種類について</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded border">
                                <span className="font-bold block text-blue-700 mb-1">集中荷重 (Point)</span>
                                1点に作用する荷重です。下向きが正(+)です。
                            </div>
                            <div className="bg-slate-50 p-3 rounded border">
                                <span className="font-bold block text-blue-700 mb-1">分布荷重 (Distributed)</span>
                                一定区間に等分布で作用します。
                            </div>
                            <div className="bg-slate-50 p-3 rounded border">
                                <span className="font-bold block text-blue-700 mb-1">台形荷重 (Trapezoid)</span>
                                始点と終点で大きさが異なる分布荷重です。三角形状も可能です。
                            </div>
                            <div className="bg-slate-50 p-3 rounded border">
                                <span className="font-bold block text-blue-700 mb-1">モーメント荷重 (Moment)</span>
                                特定の点に回転モーメントを与えます。時計回りが正(+)です。
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-900 border-l-4 border-blue-500 pl-2 mb-2">4. 機能・Tips</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>印刷機能:</strong> 右上の「印刷」ボタンから、計算書形式のレイアウトで印刷・PDF保存が可能です。</li>
                            <li><strong>データ保存(CSV出力):</strong> 計算結果および入力データをCSVファイルとして出力・保存できます。</li>
                            <li><strong>読込:</strong> 出力されたCSVファイルを読み込んで、計算条件を復元できます。</li>
                            <li><strong>着目点:</strong> グラフ下の表では、最大値発生位置などが自動計算されます。「追加」ボタンで任意の位置の結果を確認することも可能です。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-900 border-l-4 border-blue-500 pl-2 mb-2">5. 計算ロジック詳細（技術資料）</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">5.1 解析手法</h4>
                                <p>本アプリケーションでは、変位法（たわみ角法）に基づくマトリクス解析を行っています。各スパンを要素とし、節点（支点）における回転角とモーメントの釣り合い条件から連立方程式を構築し、節点モーメントを算出しています。各スパンで異なる剛性(EI)が設定された場合にも対応しています。</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">5.2 支配方程式（3連モーメントの定理の一般化）</h4>
                                <p>連続梁の任意の中間支点 <span className="math-inline">n</span> における釣り合い条件は、以下の式で表されます。</p>
                                <div className="math-display">
                                    <span className="math-inline">M</span><span className="sub">n</span>
                                    (<div className="fraction"><span><span className="math-inline">L</span><span className="sub">n</span></span><span><span className="math-inline">E</span><span className="sub">n</span><span className="math-inline">I</span><span className="sub">n</span></span></div>)
                                    <span className="op">+</span>
                                    2<span className="math-inline">M</span><span className="sub">n+1</span>
                                    (<div className="fraction"><span><span className="math-inline">L</span><span className="sub">n</span></span><span><span className="math-inline">E</span><span className="sub">n</span><span className="math-inline">I</span><span className="sub">n</span></span></div> <span className="op">+</span> <div className="fraction"><span><span className="math-inline">L</span><span className="sub">n+1</span></span><span><span className="math-inline">E</span><span className="sub">n+1</span><span className="math-inline">I</span><span className="sub">n+1</span></span></div>)
                                    <span className="op">+</span>
                                    <span className="math-inline">M</span><span className="sub">n+2</span>
                                    (<div className="fraction"><span><span className="math-inline">L</span><span className="sub">n+1</span></span><span><span className="math-inline">E</span><span className="sub">n+1</span><span className="math-inline">I</span><span className="sub">n+1</span></span></div>)
                                    <span className="op">=</span>
                                    <span className="op">-</span>6
                                    (<div className="fraction"><span><span className="math-inline">&Phi;</span><span className="sub">R,n</span></span><span><span className="math-inline">E</span><span className="sub">n</span><span className="math-inline">I</span><span className="sub">n</span></span></div> <span className="op">+</span> <div className="fraction"><span><span className="math-inline">&Phi;</span><span className="sub">L,n+1</span></span><span><span className="math-inline">E</span><span className="sub">n+1</span><span className="math-inline">I</span><span className="sub">n+1</span></span></div>)
                                </div>
                                <p className="text-xs text-slate-500 mt-1">ここで、<span className="math-inline">M</span> は節点モーメント、<span className="math-inline">L</span> はスパン長、<span className="math-inline">EI</span> は曲げ剛性、<span className="math-inline">&Phi;</span> は単純梁として計算した際の支点におけるたわみ角（荷重項）を表します。</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2">5.3 断面力および変位の算定</h4>
                                <p>算出された節点モーメント <span className="math-inline">M</span><span className="sub">L</span>, <span className="math-inline">M</span><span className="sub">R</span> を境界条件とし、各スパンごとの単純梁としての断面力（<span className="math-inline">Q</span><span className="sub">0</span>, <span className="math-inline">M</span><span className="sub">0</span>）に重ね合わせることで、任意位置 <span className="math-inline">x</span> における最終的な値を求めています。</p>
                                
                                <div className="math-display">
                                    <div className="mb-4">
                                        <span className="func">M</span>(<span className="math-inline">x</span>) <span className="op">=</span> <span className="math-inline">M</span><span className="sub">0</span>(<span className="math-inline">x</span>) <span className="op">+</span> <span className="math-inline">M</span><span className="sub">L</span> <span className="op">+</span> 
                                        <div className="fraction">
                                            <span><span className="math-inline">x</span></span>
                                            <span><span className="math-inline">L</span></span>
                                        </div>
                                        (<span className="math-inline">M</span><span className="sub">R</span> <span className="op">-</span> <span className="math-inline">M</span><span className="sub">L</span>)
                                    </div>
                                    <div>
                                        <span className="func">Q</span>(<span className="math-inline">x</span>) <span className="op">=</span> <span className="math-inline">Q</span><span className="sub">0</span>(<span className="math-inline">x</span>) <span className="op">+</span> 
                                        <div className="fraction">
                                            <span><span className="math-inline">M</span><span className="sub">R</span> <span className="op">-</span> <span className="math-inline">M</span><span className="sub">L</span></span>
                                            <span><span className="math-inline">L</span></span>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-4 mb-2"><span className="font-bold text-slate-700">支点反力 (Reactions):</span><br/>支点位置 <span className="math-inline">i</span> における反力 <span className="math-inline">R</span><span className="sub">i</span> は、その支点を挟む左右のせん断力の差として算出されます。</p>
                                <div className="math-display">
                                    <span className="math-inline">R</span><span className="sub">i</span> <span className="op">=</span> <span className="func">Q</span>(<span className="math-inline">x</span><span className="sub">i</span><span className="op">+</span>0) <span className="op">-</span> <span className="func">Q</span>(<span className="math-inline">x</span><span className="sub">i</span><span className="op">-</span>0)
                                </div>

                                <p className="mt-4 mb-2"><span className="font-bold text-slate-700">たわみ (Deflection):</span><br/>たわみ曲線微分方程式を二重積分することで算出しています。</p>
                                <div className="math-display">
                                    <div className="mb-4">
                                        <div className="fraction">
                                            <span><span className="math-inline">d</span><span className="sup">2</span><span className="math-inline">v</span></span>
                                            <span><span className="math-inline">dx</span><span className="sup">2</span></span>
                                        </div>
                                        <span className="op">=</span> <span className="op">-</span>
                                        <div className="fraction">
                                            <span><span className="func">M</span>(<span className="math-inline">x</span>)</span>
                                            <span><span className="math-inline">E</span><span className="math-inline">I</span></span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="func">v</span>(<span className="math-inline">x</span>) <span className="op">=</span> 
                                        <span className="integral">&int;&int;</span>
                                        <span className="op">-</span>
                                        <div className="fraction">
                                            <span><span className="func">M</span>(<span className="math-inline">x</span>)</span>
                                            <span><span className="math-inline">E</span><span className="math-inline">I</span></span>
                                        </div>
                                        <span className="math-inline">dx</span><span className="sup">2</span>
                                        <span className="op">+</span> <span className="math-inline">C</span><span className="sub">1</span><span className="math-inline">x</span> <span className="op">+</span> <span className="math-inline">C</span><span className="sub">2</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                <div className="p-4 border-t bg-slate-50 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors">閉じる</button>
                </div>
            </div>
        </div>
    );
}
