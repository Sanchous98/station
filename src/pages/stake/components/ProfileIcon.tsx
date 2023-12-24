import { useState } from "react"
import { ReactComponent as Terra } from "styles/images/Terra.svg"
import styles from "./ProfileIcon.module.scss"

interface Props {
  rel?: string
  abs?: string
  size: number
}

const ProfileIcon = ({ rel, abs, size }: Props) => {
  const [error, setError] = useState(false)
  const attrs = {className: styles.icon, width: size, height: size}
  if (error) return <Terra {...attrs} />
  if (!abs) {
    if (!rel) return <Terra {...attrs} />

    abs = `https://raw.githubusercontent.com/hexxagon-io/validator-images/main/images/${rel}.jpg`
  }

  return <img {...attrs} src={abs} onError={() => setError(true)} alt="" />
}

export default ProfileIcon
