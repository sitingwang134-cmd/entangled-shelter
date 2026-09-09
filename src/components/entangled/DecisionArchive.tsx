import styles from "./DecisionArchive.module.css";

// The original renderer owns its viewport and is destroyed with this frame on navigation.
export function DecisionArchive() {
  return <main className={styles.archive}>
    <iframe className={styles.stage} src="/entangled/paper-roll/index.html?v=11" title="选择档案：三维滚轴，移动指针转向，点击暂停" />
  </main>;
}
