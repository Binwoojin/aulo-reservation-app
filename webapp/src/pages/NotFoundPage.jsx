import { Link } from 'react-router-dom';
import { AppBar } from '../components/AppShell.jsx';

export default function NotFoundPage() {
  return (
    <>
      <AppBar back title="안내" />
      <div className="screen-body center-state">
        <h2 className="screen-title">화면을 찾을 수 없어요</h2>
        <Link className="button button--primary" to="/">홈으로</Link>
      </div>
    </>
  );
}
