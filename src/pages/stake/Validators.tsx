import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import VerifiedIcon from "@mui/icons-material/Verified"
import { readPercent } from "@terra-rebels/kitchen-utils"
import { Validator } from "@terra-rebels/terra.js"
/* FIXME(terra.js): Import from terra.js */
import { BondStatus } from "@terra-money/terra.proto/cosmos/staking/v1beta1/staking"
import { bondStatusFromJSON } from "@terra-money/terra.proto/cosmos/staking/v1beta1/staking"
import { combineState, useIsClassic } from "data/query"
import { useValidators } from "data/queries/staking"
import { useDelegations, useUnbondings } from "data/queries/staking"
import {getCalcVotingPowerRate, getPriorityVals} from "data/Terra/TerraAPI"
import { Page, Card, Table, Flex, Grid } from "components/layout"
import { TooltipIcon } from "components/display"
import { Toggle } from "components/form"
import WithSearchInput from "pages/custom/WithSearchInput"
import ProfileIcon from "./components/ProfileIcon"
import { ValidatorJailed } from "./components/ValidatorTag"
import styles from "./Validators.module.scss"

const Validators = () => {
  const { t } = useTranslation()
  const isClassic = useIsClassic()

  const { data: validators, ...validatorsState } = useValidators()
  const { data: delegations, ...delegationsState } = useDelegations()
  const { data: undelegations, ...undelegationsState } = useUnbondings()

  const state = combineState(
    validatorsState,
    delegationsState,
    undelegationsState,
  )

  const [byDelegated, setByDelegated] = useState(false)

  const isDelegated = useCallback(
      (operator_address: string) => {
        return delegations?.find(
            ({ validator_address }) => validator_address === operator_address
        )
      },
      [delegations]
  )

  const activeValidators = useMemo(() => {
    if (!validators) return null
    const priorityVals = getPriorityVals(validators)
    const calcRate = getCalcVotingPowerRate(validators)

    const sortedValidators = validators
        .filter(({ status, operator_address }) => !getIsUnbonded(status) &&
          (!byDelegated ? true : isDelegated(operator_address)))
        .map((validator) => {
          const { operator_address } = validator
          const voting_power_rate = calcRate(operator_address)
          return {
            ...validator,
            rank:
                (priorityVals.includes(operator_address) ? 1 : 0) + Math.random(),
            voting_power_rate,
          }
        })
        .sort((a, b) => b.rank - a.rank)

    sortedValidators.unshift(
        sortedValidators.splice(
            sortedValidators.findIndex(
                (item) => item.description.moniker.toLowerCase() === "hexxagon"
            ),
            1
        )[0]
    )

    return sortedValidators
  }, [byDelegated, isDelegated, validators])

  const renderCount = () => {
    if (!validators) return null
    const count = validators.filter(({ status }) => getIsBonded(status)).length
    return t("{{count}} active validators", { count })
  }

  const [byRank, setByRank] = useState(isClassic)
  const render = (keyword: string) => {
    if (!activeValidators) return null

    return (
      <>
        {isClassic && (
          <section>
            <TooltipIcon
              content={
                <article>
                  <ul className={styles.tooltip}>
                    <li>
                      40%: Uptime <small>(time-weighted, 90 days)</small>
                    </li>
                    <li>
                      30%: Rewards <small>(past 30 days)</small>
                    </li>
                    <li>
                      30%: Gov participation rate{" "}
                      <small>(time-weighted, since Col-5)</small>
                    </li>
                  </ul>

                  <p>
                    <small>
                      Up to 5% is deducted to the validators whose voting power
                      is within top 33%
                    </small>
                  </p>
                </article>
              }
            >
              <Toggle checked={byRank} onChange={() => setByRank(!byRank)}>
                {t("Weighted score")}
              </Toggle>
            </TooltipIcon>
            <TooltipIcon
              className={styles.tooltip_spacer}
              content={<span>Show delegated validators only</span>}
            >
              <Toggle
                checked={byDelegated}
                onChange={() => setByDelegated(!byDelegated)}
              >
                {t("Delegated only")}
              </Toggle>
            </TooltipIcon>
          </section>
        )}

        <Table
          key={Number(byRank)}
          onSort={() => setByRank(false)}
          initialSorterKey={byRank ? undefined : "rewards"}
          dataSource={activeValidators}
          filter={({ description: { moniker }, operator_address }) => {
            if (!keyword) return true
            if (moniker.toLowerCase().includes(keyword.toLowerCase()))  return true
            return operator_address === keyword
          }}
          sorter={(a, b) => Number(a.jailed) - Number(b.jailed)}
          rowKey={({ operator_address }) => operator_address}
          columns={[
            {
              title: t("Moniker"),
              dataIndex: ["description", "moniker"],
              defaultSortOrder: "asc",
              sorter: ({ description: a }, { description: b }) =>
                a.moniker.localeCompare(b.moniker),
              render: (moniker, validator) => {
                const { operator_address, jailed } = validator

                const delegated = delegations?.find(
                  ({ validator_address }) =>
                    validator_address === operator_address
                )

                const undelegated = undelegations?.find(
                  ({ validator_address }) =>
                    validator_address === operator_address
                )

                return (
                  <Flex start gap={8}>
                    <ProfileIcon src={validator.description.identity} size={22} />

                    <Grid gap={2}>
                      <Flex gap={4} start>
                        <Link
                          to={`/validator/${operator_address}`}
                          className={styles.moniker}
                        >
                          {moniker}
                        </Link>

                        {(
                          <VerifiedIcon
                            className="info"
                            style={{ fontSize: 12 }}
                          />
                        )}

                        {jailed && <ValidatorJailed />}
                      </Flex>

                      {(delegated || undelegated) && (
                        <p className={styles.muted}>
                          {[
                            delegated && t("Delegated"),
                            undelegated && t("Undelegated"),
                          ]
                            .filter(Boolean)
                            .join(" | ")}
                        </p>
                      )}
                    </Grid>
                  </Flex>
                )
              },
            },
            {
              title: t("Voting power"),
              dataIndex: "voting_power_rate",
              defaultSortOrder: "desc",
              sorter: (
                { voting_power_rate: a = 0 },
                { voting_power_rate: b = 0 }
              ) => a - b,
              render: (value = 0) => readPercent(value),
              align: "right",
            },
            {
              title: t("Commission"),
              dataIndex: ["commission", "commission_rates"],
              defaultSortOrder: "asc",
              sorter: (
                { commission: { commission_rates: a } },
                { commission: { commission_rates: b } }
              ) => a.rate.toNumber() - b.rate.toNumber(),
              render: ({ rate }: Validator.CommissionRates) =>
                readPercent(rate.toString(), { fixed: 2 }),
              align: "right",
            },
          ]}
        />
      </>
    )
  }

  return (
    <Page title={t("Validators")} extra={renderCount()} sub>
      <Card {...state}>
        <WithSearchInput gap={16}>{render}</WithSearchInput>
      </Card>
    </Page>
  )
}

export default Validators

/* helpers */
export const getIsBonded = (status: BondStatus) =>
  bondStatusFromJSON(BondStatus[status]) === BondStatus.BOND_STATUS_BONDED

export const getIsUnbonded = (status: BondStatus) =>
  bondStatusFromJSON(BondStatus[status]) === BondStatus.BOND_STATUS_UNBONDED
