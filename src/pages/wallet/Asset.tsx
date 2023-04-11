import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { has } from "utils/num"
import { WithFetching } from "components/feedback"
import { Read, TokenIcon } from "components/token"
import { useCurrency } from "data/settings/Currency"
import { useMemoizedPrices } from "data/queries/oracle"
import { Tag } from "components/display"
import AssetActions from "./AssetActions"
import styles from "./Asset.module.scss"
import is from "auth/scripts/is"

export interface Props extends TokenItem, QueryState {
  balance?: Amount
  value?: Value
  hideActions?: boolean
  usdPrice?: boolean
}

const Asset = (props: Props) => {
  const {
    token,
    icon,
    symbol,
    balance,
    value,
    hideActions,
    usdPrice,
    ...restProps
  } = props
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()

  const currency = useCurrency()
  const denom = currency === "uluna" ? "uusd" : currency
  const { data: prices } = useMemoizedPrices(denom)
  const { uluna: price } = prices || {}

  const toSend = (tokenName: string) =>
    navigate(`/send?token=${tokenName}`, { state })

  return (
    <article className={styles.asset} key={token}>
      <section className={styles.details}>
        <TokenIcon token={token} icon={icon} size={22} />

        <div className={styles.detailsContainer}>
          <h1 className={styles.symbol}>{symbol}</h1>
          <div
            className={styles.amountContainer}
            onClick={() => {
              if (!hideActions && is.mobile() && has(balance)) {
                toSend(token)
              }
            }}
          >
            <h2 className={styles.amount}>
              <WithFetching {...restProps} height={1}>
                {(progress, wrong) => (
                  <>
                    {progress}
                    {wrong ? (
                      <span className="danger">
                        {t("Failed to query balance")}
                      </span>
                    ) : (
                      <Read {...props} amount={balance} token="" />
                    )}
                  </>
                )}
              </WithFetching>
            </h2>

            {usdPrice && (
              <div className={styles.usdPrice}>
                <Tag color={"success"}>
                  {"$ "}
                  {balance && (
                    <Read
                      amount={String(price * Number(balance))}
                      prefix
                      auto
                    />
                  )}
                </Tag>
              </div>
            )}
          </div>
        </div>
      </section>

      {!hideActions && <AssetActions {...props} />}
    </article>
  )
}

export default Asset
