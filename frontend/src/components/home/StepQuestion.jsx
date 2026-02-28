import { motion } from 'framer-motion';

export default function StepQuestion({ icon, question, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="text-left"
    >
      {icon && <span className="text-5xl block mb-4">{icon}</span>}
      <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
        {question}
      </h1>
      {subtitle && (
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
