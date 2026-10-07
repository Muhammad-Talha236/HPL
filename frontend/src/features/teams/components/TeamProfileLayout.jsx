const TeamProfileLayout = ({
  clubInfo,
  mainContent,
  rightSidebar,
  recentMatches,
  upcomingMatches,
  achievements,
}) => {
  return (
    <div className="relative z-20 mx-auto -mt-[34px] w-full max-w-[1500px] px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <div className="xl:col-start-1 xl:row-start-1">{clubInfo}</div>
        <div className="min-w-0 xl:col-start-2 xl:row-start-1">{mainContent}</div>
        <div className="xl:col-start-3 xl:row-start-1">{rightSidebar}</div>

        <div className="xl:col-start-1 xl:row-start-2">{recentMatches}</div>
        <div className="min-w-0 xl:col-start-2 xl:row-start-2">
          {upcomingMatches}
        </div>
        <div className="xl:col-start-3 xl:row-start-2">{achievements}</div>
      </div>
    </div>
  );
};

export default TeamProfileLayout;
