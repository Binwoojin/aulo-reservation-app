import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container page">
      <h1 className="page-title">페이지를 찾을 수 없어요</h1>
      <Link className="button button--primary" to="/">홈으로</Link>
    </div>
  );
}
