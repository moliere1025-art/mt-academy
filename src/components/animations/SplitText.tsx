import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

export default function SplitText({ text, className, delay = 0, stagger = 0.05 }: SplitTextProps) {
  const words = text.split(' ');

  return (
    <span className={cn("inline-block", className)}>
      {words.map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap mr-[0.25em]">
          {word.split('').map((char, j) => (
            <motion.span
              key={j}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: delay + (i * words.length + j) * stagger,
                ease: [0.2, 0.65, 0.3, 0.9],
              }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
}
