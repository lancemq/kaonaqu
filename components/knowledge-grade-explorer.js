'use client';

import { useState } from 'react';
import Link from 'next/link';

const GRADES = [
  { key: 'grade6', label: '六年级', desc: '小升初衔接 · 基础巩固', disabled: true },
  {
    key: 'grade7',
    label: '七年级',
    desc: '能力提升 · 拓展思维',
    href: '/knowledge/grade-7',
    kicker: 'SEVENTH GRADE',
    intro: '七年级是初中起步阶段，重在夯实基础、培养学习习惯，逐步建立学科体系。'
  },
  {
    key: 'grade8',
    label: '八年级',
    desc: '关键学年 · 备战中考',
    href: '/knowledge/grade-8',
    kicker: 'EIGHTH GRADE',
    intro: '八年级是初中承上启下的关键学年，新增物理学科，数学难度明显提升，是备战中考的重要阶段。'
  },
  {
    key: 'grade9',
    label: '九年级',
    desc: '中考冲刺 · 全面复习',
    href: '/knowledge/grade-9',
    kicker: 'NINTH GRADE',
    intro: '九年级进入中考冲刺阶段，新增化学学科，全科系统复习与真题训练并重。'
  },
  {
    key: 'senior1',
    label: '高一',
    desc: '选科规划 · 打好基础',
    href: '/knowledge/senior-1',
    kicker: 'SENIOR ONE',
    intro: '高一适应高中学习节奏，完成初高衔接，为选科和等级考打基础。'
  },
  {
    key: 'senior2',
    label: '高二',
    desc: '深化学习 · 备战等级考',
    href: '/knowledge/senior-2',
    kicker: 'SENIOR TWO',
    intro: '高二深化各科学习，确定选科组合，备战地理、生物等等级考。'
  },
  {
    key: 'senior3',
    label: '高三',
    desc: '高考冲刺 · 志愿指导',
    href: '/knowledge/senior-3',
    kicker: 'SENIOR THREE',
    intro: '高三进入高考冲刺，全科综合复习、模拟训练与志愿填报指导。'
  }
];

const SUBJECTS_BY_GRADE = {
  grade7: [
    { title: '语文', desc: '记叙文 · 古诗文启蒙 · 写作训练', href: '/knowledge/chinese-grade7' },
    { title: '数学', desc: '有理数 · 一元一次方程 · 几何基础', href: '/knowledge/math-grade7' },
    { title: '英语', desc: '词汇积累 · 语法基础 · 听力口语', href: '/knowledge/english-grade7' },
    { title: '物理', desc: '科学探究 · 声光热入门 · 实验基础', href: '/knowledge/physics-grade7' },
    { title: '历史', desc: '中国古代史 · 朝代脉络 · 文明演进', href: '/knowledge/history-grade7' },
    { title: '道德与法治', desc: '少年生活 · 规则意识 · 社会认知', href: '/knowledge/politics-grade7' }
  ],
  grade8: [
    { title: '语文', desc: '文言文 · 现代文阅读 · 作文', href: '/knowledge/chinese-grade8' },
    { title: '数学', desc: '一次函数 · 全等三角形 · 分式', href: '/knowledge/math-grade8' },
    { title: '英语', desc: '完形填空 · 阅读理解 · 写作', href: '/knowledge/english-grade8' },
    { title: '物理', desc: '声光热 · 力学基础 · 实验探究', href: '/knowledge/physics-grade8' },
    { title: '化学', desc: '物质变化 · 化学实验基础 · 分子原子', href: '/knowledge/chemistry-grade8' },
    { title: '历史', desc: '中国近现代史 · 材料分析', href: '/knowledge/history-grade8' },
    { title: '道德与法治', desc: '宪法 · 权利义务 · 社会规则', href: '/knowledge/politics-grade8' }
  ],
  grade9: [
    { title: '语文', desc: '中考阅读 · 作文 · 古诗文精讲', href: '/knowledge/chinese-grade9' },
    { title: '数学', desc: '二次函数 · 圆 · 综合压轴', href: '/knowledge/math-grade9' },
    { title: '英语', desc: '中考听力 · 阅读写作 · 真题', href: '/knowledge/english-grade9' },
    { title: '物理', desc: '电学 · 力学综合 · 实验探究', href: '/knowledge/physics-grade9' },
    { title: '化学', desc: '方程式配平 · 物质推断 · 计算', href: '/knowledge/chemistry-grade9' },
    { title: '历史', desc: '中考专题 · 材料分析', href: '/knowledge/history-grade9' },
    { title: '道德与法治', desc: '中考时政 · 答题模板', href: '/knowledge/politics-grade9' }
  ],
  senior1: [
    { title: '语文', desc: '必修篇目 · 文言文 · 写作', href: '/knowledge/chinese-senior1' },
    { title: '数学', desc: '函数 · 立体几何 · 集合逻辑', href: '/knowledge/math-senior1' },
    { title: '英语', desc: '语法体系 · 阅读理解 · 写作', href: '/knowledge/english-senior1' },
    { title: '物理', desc: '运动 · 力 · 牛顿定律', href: '/knowledge/physics-senior1' },
    { title: '化学', desc: '物质的量 · 氧化还原 · 实验', href: '/knowledge/chemistry-senior1' },
    { title: '生物', desc: '细胞 · 遗传基础 · 生态', href: '/knowledge/biology-senior1' }
  ],
  senior2: [
    { title: '语文', desc: '选择性必修 · 古诗文 · 写作', href: '/knowledge/chinese-senior2' },
    { title: '数学', desc: '导数 · 数列 · 圆锥曲线', href: '/knowledge/math-senior2' },
    { title: '英语', desc: '概要写作 · 翻译 · 阅读', href: '/knowledge/english-senior2' },
    { title: '物理', desc: '电磁学 · 光学 · 近代物理', href: '/knowledge/physics-senior2' },
    { title: '化学', desc: '反应原理 · 有机化学 · 实验', href: '/knowledge/chemistry-senior2' },
    { title: '生物', desc: '遗传变异 · 稳态调节 · 生态', href: '/knowledge/biology-senior2' }
  ],
  senior3: [
    { title: '语文', desc: '高考专题 · 作文 · 古诗文', href: '/knowledge/chinese-senior3' },
    { title: '数学', desc: '高考综合 · 压轴突破 · 真题', href: '/knowledge/math-senior3' },
    { title: '英语', desc: '高考听力 · 阅读 · 写作', href: '/knowledge/english-senior3' },
    { title: '物理', desc: '高考综合 · 实验 · 压轴', href: '/knowledge/physics-senior3' },
    { title: '化学', desc: '高考综合 · 有机推断 · 实验', href: '/knowledge/chemistry-senior3' },
    { title: '生物', desc: '高考综合 · 遗传 · 实验', href: '/knowledge/biology-senior3' }
  ]
};

function SectionKicker({ label }) {
  return (
    <div className="channel-kicker">
      <span />
      <em>{label}</em>
    </div>
  );
}

export default function GradeSubjectExplorer() {
  const [selected, setSelected] = useState('grade8');
  const grade = GRADES.find((item) => item.key === selected) || GRADES.find((item) => !item.disabled);
  const subjects = SUBJECTS_BY_GRADE[selected] || [];

  return (
    <>
      <section className="knowledge-grade-ribbon" aria-label="年级入口">
        {GRADES.map((item) => {
          const content = (
            <>
              <strong>{item.label}</strong>
              <span>{item.desc}</span>
            </>
          );
          if (item.disabled) {
            return <div className="knowledge-grade-tile is-disabled" key={item.key}>{content}</div>;
          }
          return (
            <button
              type="button"
              className={`knowledge-grade-tile${selected === item.key ? ' is-active' : ''}`}
              onClick={() => setSelected(item.key)}
              key={item.key}
              aria-pressed={selected === item.key}
            >
              {content}
            </button>
          );
        })}
      </section>

      <section className="knowledge-section knowledge-featured-subjects">
        <div className="knowledge-section-head">
          <SectionKicker label={grade.kicker} />
          <Link href={grade.href}>查看{grade.label}全部 →</Link>
        </div>
        <h2>{grade.label} · 核心学科</h2>
        <p>{grade.intro}</p>
        <div className="knowledge-subject-strip">
          {subjects.map((subject) => (
            <Link className="knowledge-subject-card" href={subject.href} key={subject.title}>
              <span>{grade.label}</span>
              <strong>{subject.title}</strong>
              <p>{subject.desc}</p>
              <em>进入 →</em>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
