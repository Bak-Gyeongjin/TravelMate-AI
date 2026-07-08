interface Props {
  destination?: string
}

export default function FarewellCard({ destination }: Props) {
  return (
    <div className="mt-8 text-center animate-fade-in">
      <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 shadow-lg">
        <div className="text-4xl mb-3">✈️</div>
        <h3 className="text-xl font-bold text-white mb-2">
          {destination ? `${destination} 여행, 즐거운 여행 되세요!` : '즐거운 여행 되세요!'}
        </h3>
        <p className="text-sm text-emerald-100 max-w-md mx-auto">
          TravelMate AI가 준비한 정보가 도움이 되었길 바라요. 여행 중에도 편안한 마음으로 함께할게요.
        </p>
      </div>
    </div>
  )
}
