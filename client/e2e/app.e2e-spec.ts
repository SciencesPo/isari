import { IsariNg2FrontendPage } from './app.po';

describe('isari-ng2-frontend App', function() {
  let page: IsariNg2FrontendPage;

  beforeEach(() => {
    page = new IsariNg2FrontendPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
