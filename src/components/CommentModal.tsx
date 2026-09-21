import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { TreeNode } from '../types';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: TreeNode | null;
  onSaveComment: (nodeId: string, comment: string) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  node,
  onSaveComment,
}) => {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (node) {
      setComment(node.comment || '');
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveComment(node.id, comment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">设置说明备注</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                为 <span className="font-mono text-sky-400">{node.name}</span> 添加说明
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              备注内容（用于 README 和图表）
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="例如：核心业务组件、全局类型定义、静态图片"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              提示：留空保存即可清除已有备注。
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all"
            >
              保存备注
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
