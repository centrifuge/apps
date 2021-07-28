import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { baseToDisplay } from '../../tinlake.js/dist'
import { maybeLoadUserRewards, UserRewardsState } from '../ducks/userRewards'
import { addThousandsSeparators } from './addThousandsSeparators'
import { toDynamicPrecision } from './toDynamicPrecision'

export function useCFGRewards(address?: string | null) {
  const userRewards = useSelector<any, UserRewardsState>((state) => state.userRewards)
  const dispatch = useDispatch()

  React.useEffect(() => {
    if (address) {
      dispatch(maybeLoadUserRewards(address))
    }
  }, [address])

  return {
    formattedAmount: addThousandsSeparators(
      toDynamicPrecision(baseToDisplay(userRewards.data?.totalEarnedRewards || '0', 18))
    ),
    amount: userRewards.data?.totalEarnedRewards || '0',
  }
}
