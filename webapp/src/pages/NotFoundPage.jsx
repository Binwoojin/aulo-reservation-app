import { Link } from 'react-router-dom';
import { AppBar } from '../components/AppShell.jsx';
import { BrandBand } from '../components/BrandBand.jsx';
import { MyRow, MySection } from '../components/MySection.jsx';

// 없는 주소: 다른 화면과 같은 브랜드 띠 + 다시 시작할 수 있는 곳 (탭바 화면과 같은 목적지)
export default function NotFoundPage() {
  return (
    <>
      <AppBar back title="안내" />
      <div className="screen-body order-body">
        <BrandBand id="nf-title" script="lost your way?" title="찾는 화면이 없어요" hint="주소가 바뀌었거나 없어진 화면이에요. 아래에서 다시 시작해 보세요." />
        <MySection title="다시 시작하기">
          <MyRow to="/recommend" icon="compass" label="나에게 맞는 공간 찾기" />
          <MyRow to="/order" icon="cup" label="음료 메뉴 보기" />
          <MyRow to="/info" icon="info" label="이용 안내·정책" />
        </MySection>
        <Link className="button button--primary button--block" to="/">홈으로</Link>
      </div>
    </>
  );
}
