import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useTravel } from './game/useTravel';
import TravelStage from './game/TravelStage';
import { TravelControls } from './game/TravelControls';
import { EMPTY_VIEW } from './game/travel';

export default function App() {
  const game = useTravel();

  // Trang cho TikTok LIVE Studio: chỉ có sân khấu địa cầu 3D
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <TravelStage view={game.view ?? EMPTY_VIEW} />
        </StageFrame>
      </div>
    );
  }

  // Trang điều khiển: xem trước = ảnh chụp từ trang stage, im lặng
  return (
    <Dashboard
      status={game.status}
      channelName={game.channelName}
      preview={
        <StageFrame maxHeight={window.innerHeight - 40}>
          <TravelStage view={game.view ?? EMPTY_VIEW} />
        </StageFrame>
      }
      extra={<TravelControls view={game.view} stageCount={game.stageCount} />}
    />
  );
}
