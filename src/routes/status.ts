import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';

@ApplyOptions<Route.Options>({
	route: 'status'
})
export class UserRoute extends Route {
	public [methods.GET](request: ApiRequest, response: ApiResponse) {
		console.log(JSON.stringify(request), request.auth);
		response.json({ message: 'I am alive' });
	}

	public [methods.POST](_request: ApiRequest, response: ApiResponse) {
		response.json({ message: 'What...' });
	}
}
