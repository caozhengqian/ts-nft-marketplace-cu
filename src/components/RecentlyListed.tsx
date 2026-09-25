import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import NFTBox from "./NFTBox"
import Link from "next/link"

interface NFTItem {
    rindexerId: string
    seller: string
    nftAddress: string
    price: string
    tokenId: string
    contractAddress: string
    txHash: string
    blockNumber: number
}

interface BounghtCancelled{
    nftAddress: string
    tokenId: string
}
interface NFTQueryResponse {
    data: {
        allItemListeds: {
            nodes: NFTItem[]
        }
        allItemCanceleds: {
            nodes: NFTItem[]
        }
        allItemBoughts: {
            nodes: NFTItem[]
        }
    }
}
async function fetchRecentNFTs():Promise<NFTQueryResponse> {
    const repsonse = await fetch("/api/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: GET_RECENT_NFTS,
        }),
    })
    if (!repsonse.ok) {
        throw new Error("Network response was not ok")
    }
    return repsonse.json()
}

const GET_RECENT_NFTS=`
query AllItemListeds {
  allItemListeds(first: 20, orderBy: [BLOCK_NUMBER_DESC,TX_INDEX_DESC]){
    nodes {
      rindexerId
      seller
      nftAddress
      price
      tokenId
      contractAddress
      txHash
      blockNumber
    }
  }
  allItemCanceleds{
  nodes{
      nftAddress
    tokenId
  }

  }
  allItemBoughts{
  nodes{
  tokenId
    nftAddress}
    
  }
}

`
console.log(await fetchRecentNFTs())
function useRecentlyListedNFTs(){
    const {data, isLoading,error} = useQuery<NFTQueryResponse>({
        queryKey:['recentNFTs'],
        queryFn:fetchRecentNFTs,
        // queryFn:fetchNFTs,
    });
    const nftDataList = useMemo(()=>{
        if(!data) return []
        const boughtNFTs = new Set<string>()
        const cancelledNFTs = new Set<string>()
        data.data.allItemBoughts.nodes.forEach((item)=>{
            boughtNFTs.add(`${item.nftAddress}-${item.tokenId}`)
        })
        data.data.allItemCanceleds.nodes.forEach((item)=>{
            cancelledNFTs.add(`${item.nftAddress}-${item.tokenId}`)
        })
        const availableNFTs = data.data.allItemListeds.nodes.filter(item => {
            if (!item.nftAddress || !item.tokenId) return false

            const key = `${item.nftAddress}-${item.tokenId}`
            return !boughtNFTs.has(key) && !cancelledNFTs.has(key)
        })
         // Get the top 5
        const recentNFTs = availableNFTs.slice(0, 100)
                // Extract the specific data we need
        return recentNFTs.map(nft => ({
            tokenId: nft.tokenId,
            contractAddress: nft.nftAddress,
            price: nft.price,
        }))
    },[data])
    return { isLoading, error, nftDataList }
}
// Main component that uses the custom hook
export default function RecentlyListedNFTs() {
    const { isLoading, error, nftDataList } = useRecentlyListedNFTs()
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mt-8 text-center">
                <Link
                    href="/list-nft"
                    className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    List Your NFT
                </Link>
            </div>
            <h2 className="text-2xl font-bold mb-6">Recently Listed NFTs</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <img
                    src="/placeholder.png"
                    alt={`NFT`}
                    className="w-full h-auto max-h-96 object-contain bg-zinc-50"
                    onError={() => {
                        console.error("Error loading NFT image")
                    }}
                />
                {nftDataList.map(nft => (
                    <Link
                        key={`${nft.contractAddress}-${nft.tokenId}`}
                        href={`/buy-nft/${nft.contractAddress}/${nft.tokenId}`}
                        className="block transform transition hover:scale-105"
                    >
                        <NFTBox
                            key={`${nft.contractAddress}-${nft.tokenId}`}
                            tokenId={nft.tokenId}
                            contractAddress={nft.contractAddress}
                            price={nft.price}
                        />
                    </Link>
                ))}
            </div>
        </div>
    )
}