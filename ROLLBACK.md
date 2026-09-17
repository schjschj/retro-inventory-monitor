# 백업과 원복

- 수정 전 커밋: `870856fe41f011ba4e1b1402816fb582cba6c9d0`
- 백업 브랜치: `backup/pre-feedback-20260917`
- 백업 태그: `pre-feedback-20260917`
- 작업 브랜치: `feature/internal-feedback-improvements`

원복은 `git switch -c rollback/pre-feedback pre-feedback-20260917`에서 프리뷰 빌드를 확인한 후 배포한다. 운영 브랜치를 강제 초기화하지 않는다.
