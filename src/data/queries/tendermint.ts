import { useQuery } from "react-query"
import axios from "axios"
import { queryKey, RefetchOptions } from "../query"
import {API} from "../../config/constants";

export const useNodeInfo = () => {
  return useQuery(
    [queryKey.tendermint.nodeInfo],
    async () => {
      const { data } = await axios.get("node_info", { baseURL: API })
      return data
    },
    { ...RefetchOptions.INFINITY }
  )
}
