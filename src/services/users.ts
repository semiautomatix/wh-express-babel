import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as db from '../_helpers/db';

// https://florianholzapfel.github.io/express-restify-mongoose/

const Users = db.Users;

const authenticate = async ({ emailAddress, password }) => {
    const user = await Users.findOne({ emailAddress });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const { hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || '');
        return {
            ...userWithoutHash,
            token
        };
    }
};

const getAll = async () => {
    return await Users.find().select('-hash');
};

const getById = async (id) => {
    return await Users.findById(id).select('-hash');
};

const create = async (userParam) => {
    // validate
    if (await Users.findOne({ emailAddress: userParam.emailAddress })) {
        throw `Email address ${userParam.emailAddress} is already in use`;
    }

    const user = new Users(userParam);

    // hash password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // save user
    await user.save();
};

const update = async (id, userParam) => {
    const user = await Users.findById(id);

    // validate
    if (!user) throw 'Users not found';
    if (user.emailAddress !== userParam.emailAddress && await Users.findOne({ emailAddress: userParam.emailAddress })) {
        throw `Email address ${userParam.emailAddress} is already in use`;
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
};

const _delete = async (id) => {
    await Users.findByIdAndRemove(id);
};

export {
    authenticate,
    getAll,
    getById,
    create,
    update,
    _delete as delete
};